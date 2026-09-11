<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRegistrationRequest;
use App\Http\Requests\UpdateRegistrationRequest;
use App\Models\Queue;
use App\Models\Registration;
use App\Models\Unit;
use App\Models\Visit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegistrationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $query = Registration::query()
            ->with([
                'patient:id,medical_record_number,nik,name,gender,date_of_birth',
                'unit:id,name,code',
                'visit:id,registration_id,visit_number,status,started_at,completed_at,cancelled_at',
                'visit.queues:id,visit_id,unit_id,service_type,queue_number,priority,status,taken_at,called_at,started_at,completed_at',
                'creator:id,name,username',
            ]);

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($query) use ($search) {
                $query
                    ->where(
                        'registration_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'patient',
                        function ($patientQuery) use ($search) {
                            $patientQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'medical_record_number',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'nik',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
            });
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        if ($request->filled('unit_id')) {
            $query->where(
                'unit_id',
                $request->unit_id
            );
        }

        if ($request->filled('date')) {
            $query->whereDate(
                'registered_at',
                $request->date
            );
        }

        return response()->json(
            $query
                ->latest('registered_at')
                ->paginate(20)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    public function options(): JsonResponse
    {
        $units = Unit::query()
    ->where('is_active', true)
    ->where('type', 'medical')
    ->orderBy('name')
    ->get([
        'id',
        'name',
        'code',
        'type',
    ]);

        return response()->json([
            'units' => $units,

            'visit_types' => [
                [
                    'value' => 'outpatient',
        'label' => 'Rawat Jalan',
    ],
    [
        'value' => 'emergency',
        'label' => 'IGD / Gawat Darurat',
    ],
    [
        'value' => 'inpatient',
        'label' => 'Rawat Inap',
    ],
    [
        'value' => 'medical_checkup',
        'label' => 'Medical Check Up',
    ],
    [
        'value' => 'day_care',
        'label' => 'Day Care',
    ],
    [
        'value' => 'home_care',
        'label' => 'Home Care',
    ],
    [
        'value' => 'telemedicine',
        'label' => 'Telemedicine',
    ],
            ],

            'statuses' => [
                [
                    'value' => 'waiting',
                    'label' => 'Menunggu',
                ],
                [
                    'value' => 'in_service',
                    'label' => 'Dilayani',
                ],
                [
                    'value' => 'completed',
                    'label' => 'Selesai',
                ],
                [
                    'value' => 'cancelled',
                    'label' => 'Dibatalkan',
                ],
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    public function store(
        StoreRegistrationRequest $request
    ): JsonResponse {
        $registration = DB::transaction(
            function () use ($request) {
                /*
                |--------------------------------------------------------------
                | REGISTRATION
                |--------------------------------------------------------------
                */

                $registration = Registration::create([
                    'patient_id' =>
                        $request->patient_id,

                    'unit_id' =>
                        $request->unit_id,

                    'visit_type' =>
                        $request->visit_type,

                    'complaint' =>
                        $request->complaint,

                    'status' =>
                        'waiting',

                    'registered_at' =>
                        now(),

                    'created_by' =>
                        $request->user()->id,

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $registration->update([
                    'registration_number' =>
                        'REG-' .
                        now()->format('Ymd') .
                        '-' .
                        str_pad(
                            $registration->id,
                            6,
                            '0',
                            STR_PAD_LEFT
                        ),
                ]);

                /*
                |--------------------------------------------------------------
                | VISIT
                |--------------------------------------------------------------
                */

                $visit = Visit::create([
                    'registration_id' =>
                        $registration->id,

                    'visit_number' =>
                        'VIS-' .
                        now()->format('Ymd') .
                        '-' .
                        str_pad(
                            $registration->id,
                            6,
                            '0',
                            STR_PAD_LEFT
                        ),

                    'patient_id' =>
                        $registration->patient_id,

                    'unit_id' =>
                        $registration->unit_id,

                    'visit_type' =>
                        $registration->visit_type,

                    'doctor_id' =>
                        null,

                    'payment_method_id' =>
                        null,

                    'status' =>
                        'waiting',

                    'notes' =>
                        $registration->complaint,

                    'created_by' =>
                        $request->user()->id,

                    'updated_by' =>
                        $request->user()->id,
                ]);

                /*
                |--------------------------------------------------------------
                | QUEUE
                |--------------------------------------------------------------
                */

                Queue::create([
                    'visit_id' =>
                        $visit->id,

                    'unit_id' =>
                        $visit->unit_id,

                    'service_type' =>
                        'clinic',

                    'queue_number' =>
                        $this->generateQueueNumber(
                            unitId:
                                $visit->unit_id,

                            visitType:
                                $visit->visit_type
                        ),

                    'priority' =>
                        $visit->visit_type ===
                        'emergency'
                            ? 1
                            : 5,

                    'status' =>
                        'waiting',

                    'taken_at' =>
                        now(),
                ]);

                return $registration;
            }
        );

        $registration->load([
            'patient',
            'unit',
            'visit',
            'visit.queues',
        ]);

        AuditLogger::log(
            request: $request,

            action:
                'registration.create',

            module:
                'registration',

            description:
                'Petugas membuat pendaftaran, kunjungan, dan antrean pasien.',

            newValues: [
                'registration_number' =>
                    $registration->registration_number,

                'visit_number' =>
                    $registration->visit?->visit_number,

                'queue_number' =>
                    $registration
                        ->visit
                        ?->queues
                        ?->first()
                        ?->queue_number,

                'patient_id' =>
                    $registration->patient_id,

                'unit_id' =>
                    $registration->unit_id,

                'visit_type' =>
                    $registration->visit_type,

                'status' =>
                    $registration->status,
            ],
        );

        return response()->json([
            'message' =>
                'Pendaftaran pasien berhasil dibuat.',

            'data' =>
                $registration,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        Registration $registration
    ): JsonResponse {
        $registration->load([
            'patient',
            'unit',
            'visit',
            'visit.queues',
            'visit.queues.unit',
            'creator:id,name,username',
            'updater:id,name,username',
        ]);

        return response()->json([
            'data' =>
                $registration,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdateRegistrationRequest $request,
        Registration $registration
    ): JsonResponse {
        if ($registration->status !== 'waiting') {
            return response()->json([
                'message' =>
                    'Pendaftaran hanya dapat diubah sebelum pelayanan dimulai.',
            ], 422);
        }

        $oldValues = [
            'unit_id' =>
                $registration->unit_id,

            'visit_type' =>
                $registration->visit_type,

            'complaint' =>
                $registration->complaint,
        ];

        DB::transaction(
            function () use (
                $request,
                $registration
            ) {
                $oldUnitId =
                    $registration->unit_id;

                $oldVisitType =
                    $registration->visit_type;

                $registration->update([
                    'unit_id' =>
                        $request->unit_id,

                    'visit_type' =>
                        $request->visit_type,

                    'complaint' =>
                        $request->complaint,

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $visit =
                    $registration
                        ->visit()
                        ->first();

                if (! $visit) {
                    return;
                }

                $visit->update([
                    'unit_id' =>
                        $request->unit_id,

                    'visit_type' =>
                        $request->visit_type,

                    'notes' =>
                        $request->complaint,

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $queue = $visit
                    ->queues()
                    ->where(
                        'service_type',
                        'clinic'
                    )
                    ->latest('id')
                    ->first();

                if (! $queue) {
                    return;
                }

                $queueData = [
                    'unit_id' =>
                        $request->unit_id,

                    'priority' =>
                        $request->visit_type ===
                        'emergency'
                            ? 1
                            : 5,
                ];

                if (
                    $oldUnitId !=
                    $request->unit_id
                    ||
                    $oldVisitType !=
                    $request->visit_type
                ) {
                    $queueData[
                        'queue_number'
                    ] =
                        $this->generateQueueNumber(
                            unitId:
                                $request->unit_id,

                            visitType:
                                $request->visit_type,

                            excludeQueueId:
                                $queue->id
                        );
                }

                $queue->update(
                    $queueData
                );
            }
        );

        $registration->refresh();

        $registration->load([
            'patient',
            'unit',
            'visit',
            'visit.queues',
        ]);

        AuditLogger::log(
            request: $request,

            action:
                'registration.update',

            module:
                'registration',

            description:
                'Petugas memperbarui data pendaftaran dan kunjungan pasien.',

            oldValues:
                $oldValues,

            newValues: [
                'unit_id' =>
                    $registration->unit_id,

                'visit_type' =>
                    $registration->visit_type,

                'complaint' =>
                    $registration->complaint,
            ],
        );

        return response()->json([
            'message' =>
                'Pendaftaran berhasil diperbarui.',

            'data' =>
                $registration,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    public function cancel(
        Request $request,
        Registration $registration
    ): JsonResponse {
        if ($registration->status !== 'waiting') {
            return response()->json([
                'message' =>
                    'Hanya pendaftaran yang masih Menunggu yang dapat dibatalkan.',
            ], 422);
        }

        $oldStatus =
            $registration->status;

        DB::transaction(
            function () use (
                $request,
                $registration
            ) {
                $registration->update([
                    'status' =>
                        'cancelled',

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $visit =
                    $registration
                        ->visit()
                        ->first();

                if (! $visit) {
                    return;
                }

                $visit->update([
                    'status' =>
                        'cancelled',

                    'cancelled_at' =>
                        now(),

                    'updated_by' =>
                        $request->user()->id,
                ]);

                /*
                | Queue memakai status skipped ketika
                | kunjungan dibatalkan.
                */

                $visit
                    ->queues()
                    ->whereIn(
                        'status',
                        [
                            'waiting',
                            'called',
                        ]
                    )
                    ->update([
                        'status' =>
                            'skipped',

                        'updated_at' =>
                            now(),
                    ]);
            }
        );

        AuditLogger::log(
            request: $request,

            action:
                'registration.cancel',

            module:
                'registration',

            description:
                'Petugas membatalkan pendaftaran dan kunjungan pasien.',

            oldValues: [
                'status' =>
                    $oldStatus,
            ],

            newValues: [
                'registration_status' =>
                    'cancelled',

                'visit_status' =>
                    'cancelled',

                'queue_status' =>
                    'skipped',
            ],
        );

        $registration->load([
            'patient',
            'unit',
            'visit',
            'visit.queues',
        ]);

        return response()->json([
            'message' =>
                'Pendaftaran berhasil dibatalkan.',

            'data' =>
                $registration,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | START SERVICE
    |--------------------------------------------------------------------------
    */

    public function startService(
        Request $request,
        Registration $registration
    ): JsonResponse {
        if ($registration->status !== 'waiting') {
            return response()->json([
                'message' =>
                    'Pasien hanya dapat mulai dilayani ketika berstatus Menunggu.',
            ], 422);
        }

        $oldStatus =
            $registration->status;

        DB::transaction(
            function () use (
                $request,
                $registration
            ) {
                $registration->update([
                    'status' =>
                        'in_service',

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $visit =
                    $registration
                        ->visit()
                        ->first();

                if (! $visit) {
                    return;
                }

                $visit->update([
                    'status' =>
                        'in_service',

                    'started_at' =>
                        $visit->started_at
                        ?? now(),

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $queue = $visit
                    ->queues()
                    ->where(
                        'service_type',
                        'clinic'
                    )
                    ->whereIn(
                        'status',
                        [
                            'waiting',
                            'called',
                        ]
                    )
                    ->latest('id')
                    ->first();

                if ($queue) {
                    $queue->update([
                        'status' =>
                            'in_service',

                        'called_at' =>
                            $queue->called_at
                            ?? now(),

                        'started_at' =>
                            $queue->started_at
                            ?? now(),
                    ]);
                }
            }
        );

        AuditLogger::log(
            request: $request,

            action:
                'registration.start_service',

            module:
                'registration',

            description:
                'Dokter memulai pelayanan pasien.',

            oldValues: [
                'status' =>
                    $oldStatus,
            ],

            newValues: [
                'registration_status' =>
                    'in_service',

                'visit_status' =>
                    'in_service',

                'queue_status' =>
                    'in_service',
            ],
        );

        $registration->load([
            'patient',
            'unit',
            'visit',
            'visit.queues',
        ]);

        return response()->json([
            'message' =>
                'Pelayanan pasien berhasil dimulai.',

            'data' =>
                $registration,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE SERVICE
    |--------------------------------------------------------------------------
    */

    public function completeService(
        Request $request,
        Registration $registration
    ): JsonResponse {
        if ($registration->status !== 'in_service') {
            return response()->json([
                'message' =>
                    'Pasien hanya dapat diselesaikan ketika sedang Dilayani.',
            ], 422);
        }

        $oldStatus =
            $registration->status;

        DB::transaction(
            function () use (
                $request,
                $registration
            ) {
                $registration->update([
                    'status' =>
                        'completed',

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $visit =
                    $registration
                        ->visit()
                        ->first();

                if (! $visit) {
                    return;
                }

                $visit->update([
                    'status' =>
                        'completed',

                    'completed_at' =>
                        now(),

                    'updated_by' =>
                        $request->user()->id,
                ]);

                $visit
                    ->queues()
                    ->where(
                        'service_type',
                        'clinic'
                    )
                    ->where(
                        'status',
                        'in_service'
                    )
                    ->update([
                        'status' =>
                            'completed',

                        'completed_at' =>
                            now(),

                        'updated_at' =>
                            now(),
                    ]);
            }
        );

        AuditLogger::log(
            request: $request,

            action:
                'registration.complete_service',

            module:
                'registration',

            description:
                'Dokter menyelesaikan pelayanan pasien.',

            oldValues: [
                'status' =>
                    $oldStatus,
            ],

            newValues: [
                'registration_status' =>
                    'completed',

                'visit_status' =>
                    'completed',

                'queue_status' =>
                    'completed',
            ],
        );

        $registration->load([
            'patient',
            'unit',
            'visit',
            'visit.queues',
        ]);

        return response()->json([
            'message' =>
                'Pelayanan pasien berhasil diselesaikan.',

            'data' =>
                $registration,
        ]);
    }

    /*
|--------------------------------------------------------------------------
| GENERATE QUEUE NUMBER
|--------------------------------------------------------------------------
*/

private function generateQueueNumber(
    int $unitId,
    string $visitType,
    ?int $excludeQueueId = null
): string {
    /*
    |--------------------------------------------------------------------------
    | UNIT
    |--------------------------------------------------------------------------
    */

    $unit = Unit::query()
        ->select([
            'id',
            'name',
            'code',
            'queue_prefix',
        ])
        ->findOrFail($unitId);

    /*
    |--------------------------------------------------------------------------
    | PREFIX
    |--------------------------------------------------------------------------
    |
    | Prioritas utama menggunakan queue_prefix dari unit.
    |
    | Fallback hanya dipakai kalau unit lama belum memiliki prefix.
    |
    */

    $prefix =
        $unit->queue_prefix
        ?: match ($visitType) {
            'emergency' => 'IGD',
            'inpatient' => 'RI',
            default => 'A',
        };

    /*
    |--------------------------------------------------------------------------
    | QUEUE HARI INI
    |--------------------------------------------------------------------------
    |
    | Nomor dihitung per unit/poli + per hari.
    |
    | Tidak lagi dipisahkan berdasarkan visit_type.
    |
    | Contoh Poli Umum:
    |
    | Rawat Jalan       PU-001
    | Medical Check Up  PU-002
    | Rawat Jalan       PU-003
    |
    */

    $query = Queue::query()
        ->where(
            'unit_id',
            $unitId
        )
        ->where(
            'service_type',
            'clinic'
        )
        ->whereDate(
            'taken_at',
            today()
        );

    /*
    |--------------------------------------------------------------------------
    | EXCLUDE CURRENT QUEUE SAAT EDIT
    |--------------------------------------------------------------------------
    */

    if ($excludeQueueId) {
        $query->where(
            'id',
            '!=',
            $excludeQueueId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LAST QUEUE
    |--------------------------------------------------------------------------
    */

    $lastQueue = $query
        ->orderByDesc('id')
        ->lockForUpdate()
        ->first();

    $nextNumber = 1;

    /*
    |--------------------------------------------------------------------------
    | AMBIL NOMOR TERAKHIR
    |--------------------------------------------------------------------------
    |
    | Bisa membaca:
    |
    | A-001
    | PU-001
    | PG-009
    | IGD-012
    |
    */

    if (
        $lastQueue
        &&
        preg_match(
            '/(\d+)$/',
            $lastQueue->queue_number,
            $matches
        )
    ) {
        $nextNumber =
            ((int) $matches[1]) + 1;
    }

    /*
    |--------------------------------------------------------------------------
    | RESULT
    |--------------------------------------------------------------------------
    */

    return
        strtoupper($prefix)
        .
        '-'
        .
        str_pad(
            $nextNumber,
            3,
            '0',
            STR_PAD_LEFT
        );
    }
}