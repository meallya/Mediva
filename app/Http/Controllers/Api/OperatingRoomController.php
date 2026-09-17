<?php

namespace App\Http\Controllers\Api;

use App\Enums\FastingStatus;
use App\Enums\SurgeryPriority;
use App\Enums\SurgeryStatus;
use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Http\Requests\CancelSurgeryRequest;
use App\Http\Requests\ChecklistRequest;
use App\Http\Requests\CompleteSurgeryRequest;
use App\Http\Requests\RecoveryRequest;
use App\Http\Requests\ScheduleSurgeryRequest;
use App\Http\Requests\StoreSurgeryRequest;
use App\Http\Requests\TeamRequest;
use App\Http\Requests\UpdateSurgeryRequest;
use App\Http\Requests\UsageRequest;
use App\Models\OperatingRoom;
use App\Models\OperationType;
use App\Models\Surgery;
use App\Services\OperatingRoomService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OperatingRoomController extends Controller
{
    public function __construct(private readonly OperatingRoomService $service)
    {
    }

    public function dashboard(): JsonResponse
{
    $today = now()->toDateString();

    /*
    |--------------------------------------------------------------------------
    | AKTIVITAS OPERASI HARI INI
    |--------------------------------------------------------------------------
    |
    */

    $todayActivity = Surgery::query()
        ->where(
            'status',
            '!=',
            SurgeryStatus::CANCELLED->value
        )
        ->where(function ($query) use ($today) {
            $query
                ->whereDate(
                    'scheduled_start_at',
                    $today
                )
                ->orWhereDate(
                    'started_at',
                    $today
                )
                ->orWhereDate(
                    'ended_at',
                    $today
                );
        });

    return response()->json([
        'data' => [

            /*
            |--------------------------------------------------------------------------
            | OPERASI HARI INI
            |--------------------------------------------------------------------------
            */

            'today_total' =>
                (clone $todayActivity)
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | MENUNGGU
            |--------------------------------------------------------------------------
            */

            'waiting' =>
                Surgery::query()
                    ->whereIn(
                        'status',
                        [
                            SurgeryStatus::REQUESTED->value,
                            SurgeryStatus::SCHEDULED->value,
                            SurgeryStatus::PREOP->value,
                            SurgeryStatus::READY->value,
                        ]
                    )
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | SEDANG OPERASI
            |--------------------------------------------------------------------------
            */

            'in_progress' =>
                Surgery::query()
                    ->where(
                        'status',
                        SurgeryStatus::IN_PROGRESS->value
                    )
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | PEMULIHAN
            |--------------------------------------------------------------------------
            */

            'recovery' =>
                Surgery::query()
                    ->where(
                        'status',
                        SurgeryStatus::RECOVERY->value
                    )
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | SELESAI HARI INI
            |--------------------------------------------------------------------------
            */

            'completed_today' =>
                Surgery::query()
                    ->where(
                        'status',
                        SurgeryStatus::COMPLETED->value
                    )
                    ->whereDate(
                        'ended_at',
                        $today
                    )
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | KAMAR TERSEDIA
            |--------------------------------------------------------------------------
            */

            'rooms_available' =>
                OperatingRoom::query()
                    ->where(
                        'is_active',
                        true
                    )
                    ->where(
                        'status',
                        'available'
                    )
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | AKTIVITAS HARI INI
            |--------------------------------------------------------------------------
            */

            'today_schedule' =>
                (clone $todayActivity)
                    ->with([
                        'patient',
                        'operationType',
                        'operatingRoom',
                    ])
                    ->orderByRaw(
                        '
                        COALESCE(
                            started_at,
                            scheduled_start_at,
                            ended_at
                        ) ASC
                        '
                    )
                    ->limit(20)
                    ->get(),
        ],
    ]);
}

    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'priorities' => collect(SurgeryPriority::cases())->map(fn ($priority) => [
                    'value' => $priority->value,
                    'label' => $priority->label(),
                ])->values(),
                'statuses' => collect(SurgeryStatus::cases())->map(fn ($status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ])->values(),
                'fasting_statuses' => collect(FastingStatus::cases())->map(fn ($status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ])->values(),
                'operation_types' => OperationType::where('is_active', true)
                    ->orderBy('name')
                    ->get(),
                'rooms' => OperatingRoom::where('is_active', true)
                    ->where('status', 'available')
                    ->orderBy('name')
                    ->get(),
                'team_roles' => [
                    ['value' => 'operator', 'label' => 'Dokter Operator'],
                    ['value' => 'anesthesiologist', 'label' => 'Dokter Anestesi'],
                    ['value' => 'assistant', 'label' => 'Asisten'],
                    ['value' => 'instrument_nurse', 'label' => 'Perawat Instrumen'],
                    ['value' => 'circulating_nurse', 'label' => 'Perawat Sirkuler'],
                    ['value' => 'other', 'label' => 'Lainnya'],
                ],
                'recovery_statuses' => [
                    ['value' => 'waiting', 'label' => 'Menunggu'],
                    ['value' => 'observing', 'label' => 'Observasi'],
                    ['value' => 'ready_transfer', 'label' => 'Siap Transfer'],
                    ['value' => 'transferred', 'label' => 'Dipindahkan'],
                    ['value' => 'escalated', 'label' => 'Eskalasi'],
                ],
            ],
        ]);
    }

public function searchPatients(Request $request): JsonResponse
{
    $keyword = trim((string) $request->query('q'));

    if (strlen($keyword) < 2) {
        return response()->json([
            'data' => [],
        ]);
    }

    $patients = Patient::query()
        ->where(function ($query) use ($keyword) {
            $query
                ->where('name', 'like', "%{$keyword}%")
                ->orWhere(
                    'medical_record_number',
                    'like',
                    "%{$keyword}%"
                );
        })
        ->orderBy('name')
        ->limit(10)
        ->get([
            'id',
            'medical_record_number',
            'name',
            'gender',
            'date_of_birth',
            'is_active',
        ]);

    return response()->json([
        'data' => $patients,
    ]);
}

public function patientVisits(Patient $patient): JsonResponse
{
    $registrations = $patient
        ->registrations()
        ->latest()
        ->limit(10)
        ->get();

    return response()->json([
        'data' => $registrations,
    ]);
}

    public function index(Request $request): JsonResponse
    {
        $query = Surgery::query()->with([
            'patient',
            'operationType',
            'operatingRoom',
            'operatorDoctor',
        ]);

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('surgery_number', 'like', "%{$search}%")
                    ->orWhere('preoperative_diagnosis', 'like', "%{$search}%")
                    ->orWhere('planned_procedure', 'like', "%{$search}%")
                    ->orWhereHas('patient', function (Builder $patientQuery) use ($search) {
                        $patientQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $status = (string) $request->query('status', '');
        if ($status !== '' && in_array($status, array_map(fn ($case) => $case->value, SurgeryStatus::cases()), true)) {
            $query->where('status', $status);
        }

        $priority = (string) $request->query('priority', '');
        if ($priority !== '' && in_array($priority, array_map(fn ($case) => $case->value, SurgeryPriority::cases()), true)) {
            $query->where('priority', $priority);
        }

        if ($request->filled('operating_room_id')) {
            $query->where('operating_room_id', (int) $request->query('operating_room_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('scheduled_start_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('scheduled_start_at', '<=', $request->query('date_to'));
        }

        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

        return response()->json(
            $query->orderByRaw('scheduled_start_at IS NULL')
                ->orderBy('scheduled_start_at')
                ->orderByDesc('id')
                ->paginate($perPage)
        );
    }

    public function store(StoreSurgeryRequest $request): JsonResponse
    {
        $surgery = $this->service->create(
            $request->validated(),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Permintaan operasi berhasil dibuat.',
            'data' => $surgery,
        ], 201);
    }

    public function show(Surgery $surgery): JsonResponse
    {
        return response()->json([
            'data' => $this->service->loadDetail($surgery),
        ]);
    }

    public function update(UpdateSurgeryRequest $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->update(
            $surgery,
            $request->validated(),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Data operasi berhasil diperbarui.',
            'data' => $surgery,
        ]);
    }

    public function schedule(ScheduleSurgeryRequest $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->schedule(
            $surgery,
            $request->validated(),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Jadwal operasi berhasil disimpan.',
            'data' => $surgery,
        ]);
    }

    public function team(TeamRequest $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->saveTeam(
            $surgery,
            $request->validated('members'),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Tim operasi berhasil diperbarui.',
            'data' => $surgery,
        ]);
    }

    public function checklist(
        ChecklistRequest $request,
        Surgery $surgery,
        string $phase
    ): JsonResponse {
        $surgery = $this->service->saveChecklist(
            $surgery,
            $phase,
            $request->validated('items'),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Checklist operasi berhasil disimpan.',
            'data' => $surgery,
        ]);
    }

    public function start(Request $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->start(
            $surgery,
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Operasi dimulai.',
            'data' => $surgery,
        ]);
    }

    public function finish(Request $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->finish(
            $surgery,
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Operasi selesai dan pasien masuk tahap pemulihan.',
            'data' => $surgery,
        ]);
    }

    public function complete(CompleteSurgeryRequest $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->complete(
            $surgery,
            $request->validated(),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Episode operasi berhasil ditutup.',
            'data' => $surgery,
        ]);
    }

    public function cancel(CancelSurgeryRequest $request, Surgery $surgery): JsonResponse
    {
        $surgery = $this->service->cancel(
            $surgery,
            $request->validated('reason'),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Operasi berhasil dibatalkan.',
            'data' => $surgery,
        ]);
    }

    public function addUsage(UsageRequest $request, Surgery $surgery): JsonResponse
    {
        $usage = $this->service->addUsage(
            $surgery,
            $request->validated(),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Pemakaian berhasil dicatat.',
            'data' => $usage,
        ], 201);
    }

    public function recovery(RecoveryRequest $request, Surgery $surgery): JsonResponse
    {
        $recovery = $this->service->saveRecovery(
            $surgery,
            $request->validated(),
            $request->user()?->id,
            $this->activeRole($request)
        );

        return response()->json([
            'message' => 'Data pemulihan berhasil disimpan.',
            'data' => $recovery,
        ]);
    }

    private function activeRole(Request $request): ?string
    {
        $headerRole = trim((string) $request->header('X-Active-Role', ''));
        if ($headerRole !== '') {
            return $headerRole;
        }

        $attributeRole = $request->attributes->get('active_role');
        if (is_string($attributeRole) && $attributeRole !== '') {
            return $attributeRole;
        }

        $userRole = $request->user()?->getAttribute('active_role');

        return is_string($userRole) && $userRole !== '' ? $userRole : null;
    }
}
