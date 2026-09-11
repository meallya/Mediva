<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Examination;
use App\Models\Visit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\MedicalRecordSnapshotService;

class ExaminationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SHOW BY VISIT
    |--------------------------------------------------------------------------
    */

    public function showByVisit(
        Visit $visit
    ): JsonResponse {
        $visit->load([
            'patient',
            'unit',
            'doctor.employee',
            'registration',
            'queues',
            'examination.doctor.employee',
        ]);

        return response()->json([
            'data' =>
                $visit,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE EXAMINATION
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ): JsonResponse {
        $data =
            $this->validateData(
                $request
            );

        $visit =
            Visit::with([
                'registration',
                'queues',
            ])->findOrFail(
                $data['visit_id']
            );

        /*
        |--------------------------------------------------------------------------
        | HANYA VISIT YANG SEDANG DILAYANI
        |--------------------------------------------------------------------------
        */

        if (
            !in_array(
                $visit->status,
                [
                    'waiting',
                    'in_service',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Kunjungan tidak dapat diperiksa pada status saat ini.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CEGAH DUPLIKAT
        |--------------------------------------------------------------------------
        */

        if (
            Examination::where(
                'visit_id',
                $visit->id
            )->exists()
        ) {
            return response()->json([
                'message' =>
                    'Pemeriksaan untuk kunjungan ini sudah tersedia.',
            ], 422);
        }

        $user =
            $request->user();

        $doctor =
            $this->resolveDoctor(
                $user
            );

        if (!$doctor) {
            return response()->json([
                'message' =>
                    'Akun dokter tidak terhubung dengan data dokter.',
            ], 422);
        }

        $examination =
            DB::transaction(
                function () use (
                    $data,
                    $visit,
                    $doctor,
                    $user
                ) {
                    /*
                    |--------------------------------------------------------------------------
                    | PASTIKAN VISIT IN SERVICE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $visit->status !==
                        'in_service'
                    ) {
                        $visit->update([
                            'status' =>
                                'in_service',

                            'doctor_id' =>
                                $doctor->id,

                            'started_at' =>
                                $visit->started_at
                                ?? now(),

                            'updated_by' =>
                                $user->id,
                        ]);

                        if (
                            $visit->registration
                        ) {
                            $visit
                                ->registration
                                ->update([
                                    'status' =>
                                        'in_service',

                                    'updated_by' =>
                                        $user->id,
                                ]);
                        }

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
                                    'in_service',

                                'started_at' =>
                                    now(),
                            ]);
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | CREATE EXAMINATION
                    |--------------------------------------------------------------------------
                    */

                    return Examination::create([
                        ...$data,

                        'doctor_id' =>
                            $doctor->id,

                        'status' =>
                            'draft',

                        'created_by' =>
                            $user->id,

                        'updated_by' =>
                            $user->id,
                    ]);
                }
            );

        AuditLogger::log(
            request: $request,
            action:
                'examination.create',
            module:
                'examination',
            description:
                'Dokter membuat pemeriksaan pasien.',
            user:
                $user,
            newValues: [
                'examination_id' =>
                    $examination->id,

                'visit_id' =>
                    $visit->id,

                'doctor_id' =>
                    $doctor->id,
            ],
        );

        $examination->load([
            'visit.patient',
            'visit.unit',
            'doctor.employee',
        ]);

        return response()->json([
            'message' =>
                'Pemeriksaan berhasil dibuat.',

            'data' =>
                $examination,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(
        Examination $examination
    ): JsonResponse {
        $examination->load([
            'visit.patient',
            'visit.unit',
            'visit.registration',
            'visit.queues',
            'doctor.employee',
            'creator',
            'updater',
        ]);

        return response()->json([
            'data' =>
                $examination,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Examination $examination
    ): JsonResponse {
        if (
            $examination->status ===
            'completed'
        ) {
            return response()->json([
                'message' =>
                    'Pemeriksaan yang sudah selesai tidak dapat diubah.',
            ], 422);
        }

        $data =
            $this->validateData(
                $request,
                false
            );

        $oldValues =
            $examination->only([
                'subjective',
                'objective',
                'assessment',
                'plan',
                'systolic',
                'diastolic',
                'heart_rate',
                'respiratory_rate',
                'temperature',
                'weight',
                'height',
                'physical_examination',
                'doctor_notes',
            ]);

        $examination->update([
            ...$data,

            'updated_by' =>
                $request
                    ->user()
                    ->id,
        ]);

        AuditLogger::log(
            request: $request,
            action:
                'examination.update',
            module:
                'examination',
            description:
                'Dokter memperbarui pemeriksaan pasien.',
            user:
                $request->user(),
            oldValues:
                $oldValues,
            newValues:
                $examination->fresh()
                    ->only(
                        array_keys(
                            $oldValues
                        )
                    ),
        );

        return response()->json([
            'message' =>
                'Pemeriksaan berhasil diperbarui.',

            'data' =>
                $examination->fresh([
                    'visit.patient',
                    'doctor.employee',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE
    |--------------------------------------------------------------------------
    */

    public function complete(
        Request $request,
        Examination $examination
    ): JsonResponse {
        if (
            $examination->status ===
            'completed'
        ) {
            return response()->json([
                'message' =>
                    'Pemeriksaan sudah selesai.',
            ], 422);
        }

        $hasPrimaryDiagnosis =
    $examination
        ->diagnoses()
        ->where(
            'type',
            'primary'
        )
        ->exists();

if (! $hasPrimaryDiagnosis) {
    return response()->json([
        'message' =>
            'Diagnosis utama wajib diisi sebelum pemeriksaan diselesaikan.',
    ], 422);
}

        $examination->load([
            'visit.registration',
            'visit.queues',
        ]);

        DB::transaction(
            function () use (
                $examination,
                $request
            ) {
                $now = now();

                $examination->update([
                    'status' =>
                        'completed',

                    'completed_at' =>
                        $now,

                    'updated_by' =>
                        $request
                            ->user()
                            ->id,
                ]);

                $visit =
                    $examination->visit;

                $visit->update([
                    'status' =>
                        'completed',

                    'completed_at' =>
                        $now,

                    'updated_by' =>
                        $request
                            ->user()
                            ->id,
                ]);

                if (
                    $visit->registration
                ) {
                    $visit
                        ->registration
                        ->update([
                            'status' =>
                                'completed',

                            'updated_by' =>
                                $request
                                    ->user()
                                    ->id,
                        ]);
                }

                $visit
                    ->queues()
                    ->where(
                        'status',
                        'in_service'
                    )
                    ->update([
                        'status' =>
                            'completed',

                        'completed_at' =>
                            $now,
                    ]);

                /*
                |--------------------------------------------------------------------------
                | CREATE MEDICAL RECORD SNAPSHOT
                |--------------------------------------------------------------------------
                */

$examination
    ->refresh()
    ->load([
        'visit.patient',
        'visit.unit',
        'visit.registration',
        'doctor.employee',
        'diagnoses.code',
        'procedures.code',
    ]);

app(
    MedicalRecordSnapshotService::class
)->createFromExamination(
    $examination,
    $request->user()->id
);
            }
        );

        AuditLogger::log(
            request: $request,
            action:
                'examination.complete',
            module:
                'examination',
            description:
                'Dokter menyelesaikan pemeriksaan pasien.',
            user:
                $request->user(),
            newValues: [
                'examination_id' =>
                    $examination->id,

                'visit_id' =>
                    $examination->visit_id,

                'status' =>
                    'completed',
            ],
        );

        return response()->json([
            'message' =>
                'Pemeriksaan pasien berhasil diselesaikan.',

            'data' =>
                $examination->fresh([
                    'visit.patient',
                    'visit.registration',
                    'visit.queues',
                    'doctor.employee',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    private function validateData(
        Request $request,
        bool $requireVisit = true
    ): array {
        return $request->validate([
            'visit_id' => [
                $requireVisit
                    ? 'required'
                    : 'sometimes',

                'integer',
                'exists:visits,id',
            ],

            'subjective' => [
                'nullable',
                'string',
            ],

            'objective' => [
                'nullable',
                'string',
            ],

            'assessment' => [
                'nullable',
                'string',
            ],

            'plan' => [
                'nullable',
                'string',
            ],

            'systolic' => [
                'nullable',
                'integer',
                'min:40',
                'max:300',
            ],

            'diastolic' => [
                'nullable',
                'integer',
                'min:20',
                'max:200',
            ],

            'heart_rate' => [
                'nullable',
                'integer',
                'min:20',
                'max:250',
            ],

            'respiratory_rate' => [
                'nullable',
                'integer',
                'min:5',
                'max:100',
            ],

            'temperature' => [
                'nullable',
                'numeric',
                'min:25',
                'max:45',
            ],

            'weight' => [
                'nullable',
                'numeric',
                'min:0',
                'max:1000',
            ],

            'height' => [
                'nullable',
                'numeric',
                'min:0',
                'max:300',
            ],

            'physical_examination' => [
                'nullable',
                'string',
            ],

            'doctor_notes' => [
                'nullable',
                'string',
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RESOLVE DOCTOR
    |--------------------------------------------------------------------------
    */

    private function resolveDoctor(
        $user
    ): ?Doctor {
        if (!$user->employee_id) {
            return null;
        }

        return Doctor::query()
            ->where(
                'employee_id',
                $user->employee_id
            )
            ->where(
                'is_active',
                true
            )
            ->first();
    }
}