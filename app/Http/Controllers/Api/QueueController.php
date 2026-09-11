<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Queue;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QueueController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {
        $query = Queue::query()
            ->with([
                'unit:id,name,code',

                'visit:id,registration_id,visit_number,patient_id,unit_id,visit_type,status',

                'visit.patient:id,medical_record_number,nik,name,gender,date_of_birth',

                'visit.registration:id,registration_number,status,registered_at',
            ]);

        /*
        |--------------------------------------------------------------------------
        | SEARCH PATIENT / QUEUE
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search =
                trim($request->search);

            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'queue_number',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhereHas(
                            'visit',
                            function ($visitQuery) use ($search) {
                                $visitQuery
                                    ->where(
                                        'visit_number',
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
                            }
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT
        |--------------------------------------------------------------------------
        */

        if ($request->filled('unit_id')) {
            $query->where(
                'unit_id',
                $request->unit_id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SERVICE TYPE
        |--------------------------------------------------------------------------
        */

        if ($request->filled('service_type')) {
            $query->where(
                'service_type',
                $request->service_type
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DATE
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date')) {
            $query->whereDate(
                'taken_at',
                $request->date
            );
        }

        $queues = $query
            ->orderBy('priority')
            ->orderBy('taken_at')
            ->paginate(20);

        return response()->json(
            $queues
        );
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    public function options(): JsonResponse
    {
        return response()->json([
            'units' =>
                Unit::query()
                    ->select([
                        'id',
                        'name',
                        'code',
                    ])
                    ->where(
                        'is_active',
                        true
                    )
                    ->orderBy('name')
                    ->get(),

            'statuses' => [
                [
                    'value' => 'waiting',
                    'label' => 'Menunggu',
                ],
                [
                    'value' => 'called',
                    'label' => 'Dipanggil',
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
                    'value' => 'skipped',
                    'label' => 'Dilewati',
                ],
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        Queue $queue
    ): JsonResponse {
        $queue->load([
            'unit',

            'visit',

            'visit.patient',

            'visit.registration',
        ]);

        return response()->json([
            'data' =>
                $queue,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CALL PATIENT
    |--------------------------------------------------------------------------
    */

    public function call(
        Request $request,
        Queue $queue
    ): JsonResponse {
        if ($queue->status !== 'waiting') {
            return response()->json([
                'message' =>
                    'Hanya pasien berstatus Menunggu yang dapat dipanggil.',
            ], 422);
        }

        $oldStatus =
            $queue->status;

        $queue->update([
            'status' =>
                'called',

            'called_at' =>
                now(),
        ]);

        AuditLogger::log(
            request: $request,

            action:
                'queue.call',

            module:
                'queue',

            description:
                'Dokter memanggil pasien dari antrean.',

            oldValues: [
                'status' =>
                    $oldStatus,
            ],

            newValues: [
                'queue_id' =>
                    $queue->id,

                'queue_number' =>
                    $queue->queue_number,

                'status' =>
                    'called',
            ],
        );

        $queue->load([
            'unit',
            'visit.patient',
            'visit.registration',
        ]);

        return response()->json([
            'message' =>
                'Pasien berhasil dipanggil.',

            'data' =>
                $queue,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | START SERVICE
    |--------------------------------------------------------------------------
    */

    public function startService(
        Request $request,
        Queue $queue
    ): JsonResponse {
        if (
            ! in_array(
                $queue->status,
                [
                    'waiting',
                    'called',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Antrean tidak dapat memulai pelayanan.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $request,
                $queue
            ) {
                $queue->load(
                    'visit.registration'
                );

                $visit =
                    $queue->visit;

                $registration =
                    $visit?->registration;

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

                if ($visit) {
                    $visit->update([
                        'status' =>
                            'in_service',

                        'started_at' =>
                            $visit->started_at
                            ?? now(),

                        'updated_by' =>
                            $request->user()->id,
                    ]);
                }

                if ($registration) {
                    $registration->update([
                        'status' =>
                            'in_service',

                        'updated_by' =>
                            $request->user()->id,
                    ]);
                }
            }
        );

        AuditLogger::log(
            request: $request,

            action:
                'queue.start_service',

            module:
                'queue',

            description:
                'Dokter memulai pelayanan pasien dari antrean.',

            newValues: [
                'queue_id' =>
                    $queue->id,

                'queue_number' =>
                    $queue->queue_number,

                'queue_status' =>
                    'in_service',

                'visit_status' =>
                    'in_service',

                'registration_status' =>
                    'in_service',
            ],
        );

        $queue->load([
            'unit',
            'visit.patient',
            'visit.registration',
        ]);

        return response()->json([
            'message' =>
                'Pelayanan pasien berhasil dimulai.',

            'data' =>
                $queue,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE QUEUE
    |--------------------------------------------------------------------------
    */

    public function completeQueue(
        Request $request,
        Queue $queue
    ): JsonResponse {
        if ($queue->status !== 'in_service') {
            return response()->json([
                'message' =>
                    'Antrean hanya dapat diselesaikan ketika sedang Dilayani.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $request,
                $queue
            ) {
                $queue->load(
                    'visit.registration'
                );

                $visit =
                    $queue->visit;

                $registration =
                    $visit?->registration;

                $queue->update([
                    'status' =>
                        'completed',

                    'completed_at' =>
                        now(),
                ]);

                if ($visit) {
                    $visit->update([
                        'status' =>
                            'completed',

                        'completed_at' =>
                            now(),

                        'updated_by' =>
                            $request->user()->id,
                    ]);
                }

                if ($registration) {
                    $registration->update([
                        'status' =>
                            'completed',

                        'updated_by' =>
                            $request->user()->id,
                    ]);
                }
            }
        );

        AuditLogger::log(
            request: $request,

            action:
                'queue.complete',

            module:
                'queue',

            description:
                'Dokter menyelesaikan antrean dan pelayanan pasien.',

            newValues: [
                'queue_id' =>
                    $queue->id,

                'queue_number' =>
                    $queue->queue_number,

                'queue_status' =>
                    'completed',

                'visit_status' =>
                    'completed',

                'registration_status' =>
                    'completed',
            ],
        );

        $queue->load([
            'unit',
            'visit.patient',
            'visit.registration',
        ]);

        return response()->json([
            'message' =>
                'Antrean pasien berhasil diselesaikan.',

            'data' =>
                $queue,
        ]);
    }
}