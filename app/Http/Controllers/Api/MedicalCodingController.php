<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Examination;
use App\Models\ExaminationDiagnosis;
use App\Models\ExaminationProcedure;
use App\Models\Icd10Code;
use App\Models\Icd9cmCode;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicalCodingController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SEARCH ICD-10
    |--------------------------------------------------------------------------
    */

    public function searchIcd10(
        Request $request
    ): JsonResponse {
        $search = trim(
            (string) $request->get(
                'search',
                ''
            )
        );

        $query = Icd10Code::query()
            ->where('is_active', true);

        if ($search !== '') {
            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'description',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        return response()->json([
            'data' => $query
                ->orderBy('code')
                ->limit(20)
                ->get(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH ICD-9-CM
    |--------------------------------------------------------------------------
    */

    public function searchIcd9cm(
        Request $request
    ): JsonResponse {
        $search = trim(
            (string) $request->get(
                'search',
                ''
            )
        );

        $query = Icd9cmCode::query()
            ->where('is_active', true);

        if ($search !== '') {
            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'description',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        return response()->json([
            'data' => $query
                ->orderBy('code')
                ->limit(20)
                ->get(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CODING DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        Examination $examination
    ): JsonResponse {
        $examination->load([
            'diagnoses.code',
            'procedures.code',
        ]);

        return response()->json([
            'data' => [
                'diagnoses' =>
                    $examination
                        ->diagnoses
                        ->sortBy(
                            fn ($diagnosis) =>
                                $diagnosis->type === 'primary'
                                    ? 0
                                    : 1
                        )
                        ->values(),

                'procedures' =>
                    $examination
                        ->procedures
                        ->values(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ADD DIAGNOSIS
    |--------------------------------------------------------------------------
    */

    public function addDiagnosis(
        Request $request,
        Examination $examination
    ): JsonResponse {
        if ($examination->status === 'completed') {
            return response()->json([
                'message' =>
                    'Pemeriksaan sudah selesai dan tidak dapat diubah.',
            ], 422);
        }

        if (
            $response =
                $this->checkDoctorOwnership(
                    $request,
                    $examination
                )
        ) {
            return $response;
        }

        $data = $request->validate([
            'icd10_code_id' => [
                'required',
                'integer',
                'exists:icd10_codes,id',
            ],

            'type' => [
                'required',
                'string',
                'in:primary,secondary',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | DUPLICATE
        |--------------------------------------------------------------------------
        */

        $exists = ExaminationDiagnosis::query()
            ->where(
                'examination_id',
                $examination->id
            )
            ->where(
                'icd10_code_id',
                $data['icd10_code_id']
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'message' =>
                    'Diagnosis tersebut sudah ditambahkan.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | ONLY ONE PRIMARY
        |--------------------------------------------------------------------------
        */

        if ($data['type'] === 'primary') {
            $hasPrimary =
                ExaminationDiagnosis::query()
                    ->where(
                        'examination_id',
                        $examination->id
                    )
                    ->where(
                        'type',
                        'primary'
                    )
                    ->exists();

            if ($hasPrimary) {
                return response()->json([
                    'message' =>
                        'Diagnosis utama sudah tersedia.',
                ], 422);
            }
        }

        $diagnosis =
            ExaminationDiagnosis::create([
                'examination_id' =>
                    $examination->id,

                'icd10_code_id' =>
                    $data['icd10_code_id'],

                'type' =>
                    $data['type'],

                'notes' =>
                    $data['notes'] ?? null,

                'created_by' =>
                    $request->user()->id,
            ]);

        $diagnosis->load('code');

        AuditLogger::log(
            request: $request,

            action:
                'examination.diagnosis.create',

            module:
                'examination',

            description:
                'Dokter menambahkan diagnosis ICD-10.',

            newValues: [
                'examination_id' =>
                    $examination->id,

                'diagnosis_id' =>
                    $diagnosis->id,

                'icd10_code_id' =>
                    $diagnosis->icd10_code_id,

                'type' =>
                    $diagnosis->type,
            ],
        );

        return response()->json([
            'message' =>
                'Diagnosis berhasil ditambahkan.',

            'data' =>
                $diagnosis,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE DIAGNOSIS
    |--------------------------------------------------------------------------
    */

    public function deleteDiagnosis(
        Request $request,
        Examination $examination,
        ExaminationDiagnosis $diagnosis
    ): JsonResponse {
        if ($examination->status === 'completed') {
            return response()->json([
                'message' =>
                    'Pemeriksaan sudah selesai dan tidak dapat diubah.',
            ], 422);
        }

        if (
            $diagnosis->examination_id
            !== $examination->id
        ) {
            return response()->json([
                'message' =>
                    'Diagnosis tidak ditemukan pada pemeriksaan ini.',
            ], 404);
        }

        if (
            $response =
                $this->checkDoctorOwnership(
                    $request,
                    $examination
                )
        ) {
            return $response;
        }

        $oldValues = [
            'diagnosis_id' =>
                $diagnosis->id,

            'icd10_code_id' =>
                $diagnosis->icd10_code_id,

            'type' =>
                $diagnosis->type,
        ];

        $diagnosis->delete();

        AuditLogger::log(
            request: $request,

            action:
                'examination.diagnosis.delete',

            module:
                'examination',

            description:
                'Dokter menghapus diagnosis ICD-10.',

            oldValues:
                $oldValues,
        );

        return response()->json([
            'message' =>
                'Diagnosis berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ADD PROCEDURE
    |--------------------------------------------------------------------------
    */

    public function addProcedure(
        Request $request,
        Examination $examination
    ): JsonResponse {
        if ($examination->status === 'completed') {
            return response()->json([
                'message' =>
                    'Pemeriksaan sudah selesai dan tidak dapat diubah.',
            ], 422);
        }

        if (
            $response =
                $this->checkDoctorOwnership(
                    $request,
                    $examination
                )
        ) {
            return $response;
        }

        $data = $request->validate([
            'icd9cm_code_id' => [
                'required',
                'integer',
                'exists:icd9cm_codes,id',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $exists =
            ExaminationProcedure::query()
                ->where(
                    'examination_id',
                    $examination->id
                )
                ->where(
                    'icd9cm_code_id',
                    $data['icd9cm_code_id']
                )
                ->exists();

        if ($exists) {
            return response()->json([
                'message' =>
                    'Tindakan tersebut sudah ditambahkan.',
            ], 422);
        }

        $procedure =
            ExaminationProcedure::create([
                'examination_id' =>
                    $examination->id,

                'icd9cm_code_id' =>
                    $data['icd9cm_code_id'],

                'notes' =>
                    $data['notes'] ?? null,

                'created_by' =>
                    $request->user()->id,
            ]);

        $procedure->load('code');

        AuditLogger::log(
            request: $request,

            action:
                'examination.procedure.create',

            module:
                'examination',

            description:
                'Dokter menambahkan tindakan ICD-9-CM.',

            newValues: [
                'examination_id' =>
                    $examination->id,

                'procedure_id' =>
                    $procedure->id,

                'icd9cm_code_id' =>
                    $procedure->icd9cm_code_id,
            ],
        );

        return response()->json([
            'message' =>
                'Tindakan berhasil ditambahkan.',

            'data' =>
                $procedure,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PROCEDURE
    |--------------------------------------------------------------------------
    */

    public function deleteProcedure(
        Request $request,
        Examination $examination,
        ExaminationProcedure $procedure
    ): JsonResponse {
        if ($examination->status === 'completed') {
            return response()->json([
                'message' =>
                    'Pemeriksaan sudah selesai dan tidak dapat diubah.',
            ], 422);
        }

        if (
            $procedure->examination_id
            !== $examination->id
        ) {
            return response()->json([
                'message' =>
                    'Tindakan tidak ditemukan pada pemeriksaan ini.',
            ], 404);
        }

        if (
            $response =
                $this->checkDoctorOwnership(
                    $request,
                    $examination
                )
        ) {
            return $response;
        }

        $oldValues = [
            'procedure_id' =>
                $procedure->id,

            'icd9cm_code_id' =>
                $procedure->icd9cm_code_id,
        ];

        $procedure->delete();

        AuditLogger::log(
            request: $request,

            action:
                'examination.procedure.delete',

            module:
                'examination',

            description:
                'Dokter menghapus tindakan ICD-9-CM.',

            oldValues:
                $oldValues,
        );

        return response()->json([
            'message' =>
                'Tindakan berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK DOCTOR
    |--------------------------------------------------------------------------
    */

    private function checkDoctorOwnership(
        Request $request,
        Examination $examination
    ): ?JsonResponse {
        $user =
            $request->user();

        if (!$user->employee_id) {
            return response()->json([
                'message' =>
                    'Akun tidak terhubung dengan data pegawai.',
            ], 403);
        }

        $doctor =
            Doctor::query()
                ->where(
                    'employee_id',
                    $user->employee_id
                )
                ->where(
                    'is_active',
                    true
                )
                ->first();

        if (!$doctor) {
            return response()->json([
                'message' =>
                    'Profil dokter aktif tidak ditemukan.',
            ], 403);
        }

        if (
            $doctor->id !==
            $examination->doctor_id
        ) {
            return response()->json([
                'message' =>
                    'Pemeriksaan ini bukan milik dokter aktif.',
            ], 403);
        }

        return null;
    }
}