<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\Visit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST PATIENT
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {
        $patients = Patient::query()
            ->when(
                $request->search,
                function ($query, $search) {
                    $query->where(
                        function ($query) use ($search) {
                            $query
                                ->where(
                                    'medical_record_number',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'nik',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->latest()
            ->paginate(20);

        return response()->json(
            $patients
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PATIENT
    |--------------------------------------------------------------------------
    */

    public function store(
        StorePatientRequest $request
    ): JsonResponse {
        $data =
            $request->validated();

        $data['medical_record_number'] =
            $this->generateMedicalRecordNumber();

        $data['created_by'] =
            $request->user()->id;

        $data['updated_by'] =
            $request->user()->id;

        $patient =
            Patient::create(
                $data
            );

        AuditLogger::log(
            request: $request,
            action: 'patient.create',
            module: 'patient',
            description:
                'User membuat data pasien baru.',
            newValues:
                $patient->toArray(),
        );

        return response()->json([
            'message' =>
                'Pasien berhasil dibuat.',

            'data' =>
                $patient,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL PATIENT
    |--------------------------------------------------------------------------
    */

    public function show(
        Patient $patient
    ): JsonResponse {
        return response()->json([
            'data' =>
                $patient,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PATIENT
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdatePatientRequest $request,
        Patient $patient
    ): JsonResponse {
        $oldValues =
            $patient->toArray();

        $data =
            $request->validated();

        $data['updated_by'] =
            $request->user()->id;

        $patient->update(
            $data
        );

        $patient->refresh();

        AuditLogger::log(
            request: $request,
            action: 'patient.update',
            module: 'patient',
            description:
                'User mengubah data pasien.',
            oldValues:
                $oldValues,
            newValues:
                $patient->toArray(),
        );

        return response()->json([
            'message' =>
                'Data pasien berhasil diperbarui.',

            'data' =>
                $patient,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PATIENT
    |--------------------------------------------------------------------------
    |
    | Patient menggunakan Soft Delete.
    |
    | Pasien hanya boleh dihapus apabila belum mempunyai:
    |
    | - Pendaftaran
    | - Kunjungan
    |
    | Tujuannya supaya pasien yang sudah mempunyai riwayat pelayanan
    | tidak menghilang dari relasi data klinis.
    |
    */

    public function destroy(
        Request $request,
        Patient $patient
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | CHECK REGISTRATION HISTORY
        |--------------------------------------------------------------------------
        */

        $hasRegistration =
            Registration::query()
                ->where(
                    'patient_id',
                    $patient->id
                )
                ->exists();

        /*
        |--------------------------------------------------------------------------
        | CHECK VISIT HISTORY
        |--------------------------------------------------------------------------
        */

        $hasVisit =
            Visit::query()
                ->where(
                    'patient_id',
                    $patient->id
                )
                ->exists();

        /*
        |--------------------------------------------------------------------------
        | PROTECT CLINICAL HISTORY
        |--------------------------------------------------------------------------
        */

        if (
            $hasRegistration ||
            $hasVisit
        ) {
            return response()->json([
                'message' =>
                    'Pasien tidak dapat dihapus karena sudah memiliki riwayat pendaftaran atau kunjungan.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | STORE OLD VALUE
        |--------------------------------------------------------------------------
        */

        $oldValues =
            $patient->toArray();

        /*
        |--------------------------------------------------------------------------
        | SOFT DELETE
        |--------------------------------------------------------------------------
        */

        $patient->delete();

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,
            action: 'patient.delete',
            module: 'patient',
            description:
                'User menghapus data pasien.',
            oldValues:
                $oldValues,
        );

        return response()->json([
            'message' =>
                'Data pasien berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE MEDICAL RECORD NUMBER
    |--------------------------------------------------------------------------
    */

    private function generateMedicalRecordNumber(): string
    {
        /*
        |--------------------------------------------------------------------------
        | INCLUDE SOFT DELETED PATIENT
        |--------------------------------------------------------------------------
        |
        | Nomor RM yang pernah digunakan tidak boleh dipakai kembali.
        |
        */

        $lastPatient =
            Patient::withTrashed()
                ->latest('id')
                ->first();

        $nextNumber =
            ($lastPatient?->id ?? 0) + 1;

        return 'RM-' .
            str_pad(
                $nextNumber,
                6,
                '0',
                STR_PAD_LEFT
            );
    }
}