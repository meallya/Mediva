<?php

namespace App\Services;

use App\Enums\SurgeryStatus;
use App\Models\OperatingRoom;
use App\Models\OperatingRoomUsage;
use App\Models\Surgery;
use App\Models\SurgeryRecovery;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OperatingRoomService
{
    public const DETAIL_RELATIONS = [
    'patient',
    'visit',
    'requestingDoctor',
    'operatorDoctor',
    'anesthesiologistDoctor',
    'operationType',
    'operatingRoom',
    'teamMembers',
    'safetyChecklist',
    'usages',
    'recovery',
    'histories',
];

    public function create(array $data, ?int $actorId = null, ?string $activeRole = null): Surgery
    {
        return DB::transaction(function () use ($data, $actorId, $activeRole) {
            $data['surgery_number'] = $this->nextSurgeryNumber();
            $data['status'] = SurgeryStatus::REQUESTED;
            $data['created_by'] = $actorId;
            $data['updated_by'] = $actorId;

            $this->applyConsentMetadata($data, $actorId);

            $surgery = Surgery::create($data);
            $this->recordHistory($surgery, 'surgery_requested', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function update(
        Surgery $surgery,
        array $data,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        $this->ensureNotTerminal($surgery);

        return DB::transaction(function () use ($surgery, $data, $actorId, $activeRole) {
            $data['updated_by'] = $actorId;
            $this->applyConsentMetadata($data, $actorId, $surgery);

            $surgery->update($data);
            $this->recordHistory($surgery, 'surgery_updated', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function schedule(
        Surgery $surgery,
        array $data,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        if (! in_array($surgery->status, [
            SurgeryStatus::REQUESTED,
            SurgeryStatus::SCHEDULED,
            SurgeryStatus::PREOP,
            SurgeryStatus::READY,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'Operasi pada status ini tidak dapat dijadwalkan ulang.',
            ]);
        }

        $this->ensureRoomAvailable(
            (int) $data['operating_room_id'],
            $data['scheduled_start_at'],
            $data['scheduled_end_at'],
            $surgery->id
        );

        return DB::transaction(function () use ($surgery, $data, $actorId, $activeRole) {
            if (empty($data['duration_minutes'])) {
                $data['duration_minutes'] = (int) round(
                    Carbon::parse($data['scheduled_start_at'])
                        ->diffInMinutes(Carbon::parse($data['scheduled_end_at']))
                );
            }

            $data['status'] = SurgeryStatus::SCHEDULED;
            $data['updated_by'] = $actorId;

            $surgery->update($data);
            $this->syncPreparationStatus($surgery);
            $this->recordHistory($surgery, 'surgery_scheduled', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function saveTeam(
        Surgery $surgery,
        array $members,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        $this->ensureNotTerminal($surgery);

        if ($surgery->status === SurgeryStatus::RECOVERY) {
            throw ValidationException::withMessages([
                'team' => 'Tim operasi tidak dapat diubah setelah pasien masuk pemulihan.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $members, $actorId, $activeRole) {
            $surgery->teamMembers()->delete();

            foreach ($members as $member) {
                $surgery->teamMembers()->create($member);
            }

            $operator = collect($members)->first(
                fn (array $member) => $member['role'] === 'operator' && ! empty($member['doctor_id'])
            );
            $anesthesiologist = collect($members)->first(
                fn (array $member) => $member['role'] === 'anesthesiologist' && ! empty($member['doctor_id'])
            );

            $sync = ['updated_by' => $actorId];
            if ($operator) {
                $sync['operator_doctor_id'] = $operator['doctor_id'];
            }
            if ($anesthesiologist) {
                $sync['anesthesiologist_doctor_id'] = $anesthesiologist['doctor_id'];
            }

            $surgery->update($sync);
            $this->syncPreparationStatus($surgery);
            $this->recordHistory($surgery, 'surgery_team_updated', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function saveChecklist(
        Surgery $surgery,
        string $phase,
        array $items,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        $this->ensureNotTerminal($surgery);

        $map = [
            'preoperative' => ['preoperative_checklist', 'preoperative_completed_at', 'preoperative_completed_by'],
            'sign-in' => ['sign_in', 'sign_in_completed_at', 'sign_in_completed_by'],
            'time-out' => ['time_out', 'time_out_completed_at', 'time_out_completed_by'],
            'sign-out' => ['sign_out', 'sign_out_completed_at', 'sign_out_completed_by'],
        ];

        if (! isset($map[$phase])) {
            throw ValidationException::withMessages([
                'phase' => 'Fase checklist operasi tidak valid.',
            ]);
        }

        if ($phase === 'sign-out' && ! in_array($surgery->status, [
            SurgeryStatus::IN_PROGRESS,
            SurgeryStatus::RECOVERY,
        ], true)) {
            throw ValidationException::withMessages([
                'phase' => 'Sign Out hanya dapat diisi saat atau setelah operasi berlangsung.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $phase, $items, $actorId, $activeRole, $map) {
            [$dataColumn, $completedAtColumn, $completedByColumn] = $map[$phase];
            $isComplete = collect($items)->isNotEmpty()
                && collect($items)->every(fn (array $item) => (bool) ($item['checked'] ?? false));

            $checklist = $surgery->safetyChecklist()->firstOrCreate(['surgery_id' => $surgery->id]);
            $checklist->update([
                $dataColumn => $items,
                $completedAtColumn => $isComplete ? now() : null,
                $completedByColumn => $isComplete ? $actorId : null,
            ]);

            $this->syncPreparationStatus($surgery->fresh());
            $this->recordHistory(
                $surgery,
                'checklist_'.$phase.($isComplete ? '_completed' : '_saved'),
                $actorId,
                $activeRole
            );

            return $this->loadDetail($surgery);
        });
    }

    public function start(
        Surgery $surgery,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        $surgery->refresh();
        $this->syncPreparationStatus($surgery);
        $surgery->refresh();

        if ($surgery->status !== SurgeryStatus::READY) {
            throw ValidationException::withMessages([
                'status' => 'Operasi belum siap dimulai. Lengkapi jadwal, dokter operator, consent, Pra Operasi, Sign In, dan Time Out.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $actorId, $activeRole) {
            $surgery->update([
                'status' => SurgeryStatus::IN_PROGRESS,
                'started_at' => $surgery->started_at ?? now(),
                'updated_by' => $actorId,
            ]);

            $this->recordHistory($surgery, 'surgery_started', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function finish(
        Surgery $surgery,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        if ($surgery->status !== SurgeryStatus::IN_PROGRESS) {
            throw ValidationException::withMessages([
                'status' => 'Hanya operasi yang sedang berlangsung yang dapat diselesaikan.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $actorId, $activeRole) {
            $endedAt = now();
            $duration = $surgery->started_at
                ? (int) round($surgery->started_at->diffInMinutes($endedAt))
                : $surgery->duration_minutes;

            $surgery->update([
                'status' => SurgeryStatus::RECOVERY,
                'ended_at' => $endedAt,
                'duration_minutes' => $duration,
                'updated_by' => $actorId,
            ]);

            $surgery->recovery()->firstOrCreate(
                ['surgery_id' => $surgery->id],
                [
                    'recovery_started_at' => $endedAt,
                    'status' => 'waiting',
                    'recorded_by' => $actorId,
                ]
            );

            $this->recordHistory($surgery, 'surgery_finished', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function complete(
        Surgery $surgery,
        array $data = [],
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        if ($surgery->status !== SurgeryStatus::RECOVERY) {
            throw ValidationException::withMessages([
                'status' => 'Episode operasi hanya dapat ditutup dari tahap pemulihan.',
            ]);
        }

        $surgery->loadMissing(['safetyChecklist', 'recovery']);

        if (! $surgery->safetyChecklist?->sign_out_completed_at) {
            throw ValidationException::withMessages([
                'checklist' => 'Checklist Sign Out harus diselesaikan sebelum episode operasi ditutup.',
            ]);
        }

        if (! $surgery->recovery || ! in_array($surgery->recovery->status, [
            'ready_transfer', 'transferred', 'escalated',
        ], true)) {
            throw ValidationException::withMessages([
                'recovery' => 'Status pemulihan harus Siap Transfer, Dipindahkan, atau Eskalasi sebelum episode ditutup.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $data, $actorId, $activeRole) {
            $surgery->update(array_merge($data, [
                'status' => SurgeryStatus::COMPLETED,
                'updated_by' => $actorId,
            ]));

            if ($surgery->recovery && ! $surgery->recovery->recovery_ended_at) {
                $surgery->recovery->update(['recovery_ended_at' => now()]);
            }

            $this->recordHistory($surgery, 'surgery_completed', $actorId, $activeRole);
            event('operating-room.surgery-completed', [$surgery->fresh()]);

            return $this->loadDetail($surgery);
        });
    }

    public function cancel(
        Surgery $surgery,
        string $reason,
        ?int $actorId = null,
        ?string $activeRole = null
    ): Surgery {
        if (in_array($surgery->status, [
            SurgeryStatus::IN_PROGRESS,
            SurgeryStatus::RECOVERY,
            SurgeryStatus::COMPLETED,
            SurgeryStatus::CANCELLED,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'Operasi pada status ini tidak dapat dibatalkan.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $reason, $actorId, $activeRole) {
            $surgery->update([
                'status' => SurgeryStatus::CANCELLED,
                'cancel_reason' => $reason,
                'cancelled_at' => now(),
                'updated_by' => $actorId,
            ]);

            $this->recordHistory($surgery, 'surgery_cancelled', $actorId, $activeRole);

            return $this->loadDetail($surgery);
        });
    }

    public function addUsage(
        Surgery $surgery,
        array $data,
        ?int $actorId = null,
        ?string $activeRole = null
    ): OperatingRoomUsage {
        if (! in_array($surgery->status, [
            SurgeryStatus::PREOP,
            SurgeryStatus::READY,
            SurgeryStatus::IN_PROGRESS,
            SurgeryStatus::RECOVERY,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'Pemakaian hanya dapat dicatat pada tahap persiapan, operasi, atau pemulihan.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $data, $actorId, $activeRole) {
            $data['recorded_by'] = $actorId;
            $usage = $surgery->usages()->create($data);

            $this->recordHistory($surgery, 'usage_recorded', $actorId, $activeRole, [
                'usage_id' => $usage->id,
                'usage_type' => $usage->usage_type,
                'item_name' => $usage->item_name,
                'quantity' => $usage->quantity,
                'unit' => $usage->unit,
                'billable' => $usage->billable,
            ]);

            // Integration hook. Pharmacy/inventory/asset/billing listeners can subscribe
            // without coupling the Operating Room module to their internal schemas.
            event('operating-room.usage-recorded', [$usage, $surgery]);

            return $usage->fresh();
        });
    }

    public function saveRecovery(
        Surgery $surgery,
        array $data,
        ?int $actorId = null,
        ?string $activeRole = null
    ): SurgeryRecovery {
        if ($surgery->status !== SurgeryStatus::RECOVERY) {
            throw ValidationException::withMessages([
                'status' => 'Data pemulihan hanya dapat dicatat setelah operasi selesai.',
            ]);
        }

        return DB::transaction(function () use ($surgery, $data, $actorId, $activeRole) {
            $data['recorded_by'] = $actorId;
            $data['recovery_started_at'] = $data['recovery_started_at']
                ?? $surgery->ended_at
                ?? now();

            if (in_array($data['status'] ?? null, ['transferred', 'escalated'], true)
                && empty($data['recovery_ended_at'])) {
                $data['recovery_ended_at'] = now();
            }

            $recovery = $surgery->recovery()->updateOrCreate(
                ['surgery_id' => $surgery->id],
                $data
            );

            $this->recordHistory($surgery, 'recovery_updated', $actorId, $activeRole, [
                'recovery_status' => $recovery->status,
                'pain_score' => $recovery->pain_score,
                'aldrete_score' => $recovery->aldrete_score,
            ]);

            return $recovery->fresh();
        });
    }

    public function loadDetail(Surgery $surgery): Surgery
    {
        return $surgery->fresh()->load(self::DETAIL_RELATIONS);
    }

    private function nextSurgeryNumber(): string
    {
        $date = now()->toDateString();
        $prefix = 'OP-'.now()->format('Ymd').'-';

        DB::table('operating_room_sequences')->insertOrIgnore([
            'sequence_date' => $date,
            'last_number' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $row = DB::table('operating_room_sequences')
            ->where('sequence_date', $date)
            ->lockForUpdate()
            ->first();

        $lastExistingNumber = Surgery::query()
            ->where('surgery_number', 'like', $prefix.'%')
            ->orderByDesc('surgery_number')
            ->value('surgery_number');

        $existingSequence = 0;
        if (is_string($lastExistingNumber) && str_starts_with($lastExistingNumber, $prefix)) {
            $existingSequence = (int) substr($lastExistingNumber, strlen($prefix));
        }

        $next = max((int) ($row->last_number ?? 0), $existingSequence) + 1;

        DB::table('operating_room_sequences')
            ->where('sequence_date', $date)
            ->update([
                'last_number' => $next,
                'updated_at' => now(),
            ]);

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    private function ensureRoomAvailable(
        int $roomId,
        string $startAt,
        string $endAt,
        ?int $ignoreSurgeryId = null
    ): void {
        $roomIsAvailable = OperatingRoom::query()
            ->whereKey($roomId)
            ->where('is_active', true)
            ->where('status', 'available')
            ->exists();

        if (! $roomIsAvailable) {
            throw ValidationException::withMessages([
                'operating_room_id' => 'Kamar operasi tidak aktif atau sedang tidak tersedia.',
            ]);
        }

        $conflict = Surgery::query()
            ->where('operating_room_id', $roomId)
            ->where('status', '!=', SurgeryStatus::CANCELLED->value)
            ->when($ignoreSurgeryId, fn ($query) => $query->where('id', '!=', $ignoreSurgeryId))
            ->whereNotNull('scheduled_start_at')
            ->whereNotNull('scheduled_end_at')
            ->where('scheduled_start_at', '<', $endAt)
            ->where('scheduled_end_at', '>', $startAt)
            ->exists();

        if ($conflict) {
            throw ValidationException::withMessages([
                'operating_room_id' => 'Kamar operasi sudah digunakan pada rentang waktu tersebut.',
            ]);
        }
    }

    private function syncPreparationStatus(Surgery $surgery): void
    {
        if (! in_array($surgery->status, [
            SurgeryStatus::SCHEDULED,
            SurgeryStatus::PREOP,
            SurgeryStatus::READY,
        ], true)) {
            return;
        }

        $surgery->loadMissing('safetyChecklist');
        $checklist = $surgery->safetyChecklist;

        if ($surgery->status === SurgeryStatus::SCHEDULED
            && $checklist?->preoperative_completed_at) {
            $surgery->update(['status' => SurgeryStatus::PREOP]);
            $surgery->refresh();
        }

        if ($surgery->status === SurgeryStatus::PREOP && $this->isReadyForOperation($surgery)) {
            $surgery->update(['status' => SurgeryStatus::READY]);
        }
    }

    private function isReadyForOperation(Surgery $surgery): bool
    {
        $surgery->loadMissing('safetyChecklist');
        $checklist = $surgery->safetyChecklist;

        return (bool) $surgery->operating_room_id
            && (bool) $surgery->scheduled_start_at
            && (bool) $surgery->scheduled_end_at
            && (bool) $surgery->operator_doctor_id
            && (bool) $surgery->consent_obtained
            && (bool) $checklist?->preoperative_completed_at
            && (bool) $checklist?->sign_in_completed_at
            && (bool) $checklist?->time_out_completed_at;
    }

    private function ensureNotTerminal(Surgery $surgery): void
    {
        if ($surgery->status->isTerminal()) {
            throw ValidationException::withMessages([
                'status' => 'Data operasi yang sudah selesai atau dibatalkan tidak dapat diubah.',
            ]);
        }
    }

    private function applyConsentMetadata(
        array &$data,
        ?int $actorId,
        ?Surgery $current = null
    ): void {
        if (! array_key_exists('consent_obtained', $data)) {
            return;
        }

        if ((bool) $data['consent_obtained']) {
            $data['consent_obtained_at'] = $current?->consent_obtained_at ?? now();
            $data['consent_recorded_by'] = $current?->consent_recorded_by ?? $actorId;
            return;
        }

        $data['consent_obtained_at'] = null;
        $data['consent_recorded_by'] = null;
    }

    private function recordHistory(
        Surgery $surgery,
        string $event,
        ?int $actorId,
        ?string $activeRole,
        ?array $snapshot = null
    ): void {
        $surgery->histories()->create([
            'event' => $event,
            'snapshot' => $snapshot ?? $surgery->fresh()->toArray(),
            'actor_id' => $actorId,
            'active_role' => $activeRole,
            'created_at' => now(),
        ]);
    }
}
