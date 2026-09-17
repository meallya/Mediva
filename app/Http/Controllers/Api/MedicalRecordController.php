<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\MedicalRecordRevision;
use App\Models\Patient;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedicalRecordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | PATIENT MEDICAL RECORD
    |--------------------------------------------------------------------------
    */

    public function showPatient(
        Request $request,
        Patient $patient
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | LOAD MEDICAL RECORDS
        |--------------------------------------------------------------------------
        */

        $records =
            MedicalRecord::query()
                ->where(
                    'patient_id',
                    $patient->id
                )
                ->with([
                    'visit.registration',
                    'visit.prescription.items.medicine',
                    'visit.laboratoryOrders.items.testType',
                    'visit.laboratoryOrders.items.results.parameter',
                    'visit.laboratoryOrders.specimens.sampleType',
                    'unit',
                    'doctor.employee',
                    'revisions.creator',
                ])
                ->latest(
                    'finalized_at'
                )
                ->get();

        /*
        |--------------------------------------------------------------------------
        | FORMAT VISITS
        |--------------------------------------------------------------------------
        */

        $visits =
            $records->map(
                function (
                    MedicalRecord $record
                ) {
                    $visit =
                        $record->visit;

                    $prescription =
                        $visit?->prescription;

                    $laboratoryOrders =
                        $visit?->laboratoryOrders
                        ?? collect();

                    $clinical =
                        $record
                            ->clinical_snapshot
                        ?? [];

                    $coding =
                        $record
                            ->coding_snapshot
                        ?? [];

                    $vitals =
                        $clinical[
                            'vital_signs'
                        ]
                        ?? [];

                    return [
                        /*
                        |------------------------------------------------------
                        | VISIT
                        |------------------------------------------------------
                        */

                        'id' =>
                            $visit?->id,

                        'visit_number' =>
                            $visit
                                ?->visit_number,

                        'visit_type' =>
                            $visit
                                ?->visit_type,

                        'status' =>
                            $visit
                                ?->status,

                        'started_at' =>
                            $visit
                                ?->started_at,

                        'completed_at' =>
                            $visit
                                ?->completed_at,

                        /*
                        |------------------------------------------------------
                        | MEDICAL RECORD META
                        |------------------------------------------------------
                        */

                        'medical_record' => [
                            'id' =>
                                $record->id,

                            'record_number' =>
                                $record
                                    ->record_number,

                            'finalized_at' =>
                                $record
                                    ->finalized_at,

                            'created_by' =>
                                $record
                                    ->created_by,

                            'updated_by' =>
                                $record
                                    ->updated_by,

                            'revisions' =>
                                $record
                                    ->revisions
                                    ->map(
                                        fn ($revision) => [
                                            'id' =>
                                                $revision
                                                    ->id,

                                            'revision_number' =>
                                                $revision
                                                    ->revision_number,

                                            'section' =>
                                                $revision
                                                    ->section,

                                            'reason' =>
                                                $revision
                                                    ->reason,

                                            'note' =>
                                                $revision
                                                    ->note,

                                            'created_at' =>
                                                $revision
                                                    ->created_at,

                                            'created_by' =>
                                                $revision
                                                    ->creator
                                                    ?->name,
                                        ]
                                    )
                                    ->values(),
                        ],

                        /*
                        |------------------------------------------------------
                        | UNIT
                        |------------------------------------------------------
                        */

                        'unit' => [
                            'id' =>
                                $record
                                    ->unit
                                    ?->id,

                            'name' =>
                                $record
                                    ->unit
                                    ?->name,

                            'code' =>
                                $record
                                    ->unit
                                    ?->code,
                        ],

                        /*
                        |------------------------------------------------------
                        | DOCTOR
                        |------------------------------------------------------
                        */

                        'doctor' => [
                            'id' =>
                                $record
                                    ->doctor
                                    ?->id,

                            'name' =>
                                $record
                                    ->doctor
                                    ?->employee
                                    ?->name,

                            'specialization' =>
                                $record
                                    ->doctor
                                    ?->specialization,
                        ],

                        /*
                        |------------------------------------------------------
                        | REGISTRATION
                        |------------------------------------------------------
                        */

                        'registration' =>
                            $visit
                                ?->registration
                                ? [
                                    'id' =>
                                        $visit
                                            ->registration
                                            ->id,

                                    'registration_number' =>
                                        $visit
                                            ->registration
                                            ->registration_number,

                                    'complaint' =>
                                        $visit
                                            ->registration
                                            ->complaint,

                                    'registered_at' =>
                                        $visit
                                            ->registration
                                            ->registered_at,

                                    'status' =>
                                        $visit
                                            ->registration
                                            ->status,
                                ]
                                : null,

                        /*
                        |------------------------------------------------------
                        | EXAMINATION SNAPSHOT
                        |------------------------------------------------------
                        */

                        'examination' => [
                            'status' =>
                                'completed',

                            'completed_at' =>
                                $record
                                    ->finalized_at,

                            /*
                            |--------------------------------------------------
                            | SOAP
                            |--------------------------------------------------
                            */

                            'subjective' =>
                                $clinical[
                                    'subjective'
                                ]
                                ?? null,

                            'objective' =>
                                $clinical[
                                    'objective'
                                ]
                                ?? null,

                            'assessment' =>
                                $clinical[
                                    'assessment'
                                ]
                                ?? null,

                            'plan' =>
                                $clinical[
                                    'plan'
                                ]
                                ?? null,

                            /*
                            |--------------------------------------------------
                            | VITAL SIGNS
                            |--------------------------------------------------
                            */

                            'systolic' =>
                                $vitals[
                                    'systolic'
                                ]
                                ?? null,

                            'diastolic' =>
                                $vitals[
                                    'diastolic'
                                ]
                                ?? null,

                            'heart_rate' =>
                                $vitals[
                                    'heart_rate'
                                ]
                                ?? null,

                            'respiratory_rate' =>
                                $vitals[
                                    'respiratory_rate'
                                ]
                                ?? null,

                            'temperature' =>
                                $vitals[
                                    'temperature'
                                ]
                                ?? null,

                            'weight' =>
                                $vitals[
                                    'weight'
                                ]
                                ?? null,

                            'height' =>
                                $vitals[
                                    'height'
                                ]
                                ?? null,

                            /*
                            |--------------------------------------------------
                            | OTHER CLINICAL DATA
                            |--------------------------------------------------
                            */

                            'physical_examination' =>
                                $clinical[
                                    'physical_examination'
                                ]
                                ?? null,

                            'doctor_notes' =>
                                $clinical[
                                    'doctor_notes'
                                ]
                                ?? null,

                            /*
                            |--------------------------------------------------
                            | CODING
                            |--------------------------------------------------
                            */

                            'diagnoses' =>
                                $coding[
                                    'diagnoses'
                                ]
                                ?? [],

                            'procedures' =>
                                $coding[
                                    'procedures'
                                ]
                                ?? [],
                        ],

                        /*
                        |------------------------------------------------------
                        | PRESCRIPTION
                        |------------------------------------------------------
                        */

                        'prescription' =>
                            $prescription
                                ? [
                                    'id' =>
                                        $prescription
                                            ->id,

                                    'prescription_number' =>
                                        $prescription
                                            ->prescription_number,

                                    'status' =>
                                        $prescription
                                            ->status,

                                    'doctor_notes' =>
                                        $prescription
                                            ->doctor_notes,

                                    'submitted_at' =>
                                        $prescription
                                            ->submitted_at,

                                    'dispensed_at' =>
                                        $prescription
                                            ->dispensed_at,

                                    'cancelled_at' =>
                                        $prescription
                                            ->cancelled_at,

                                    'items' =>
                                        $prescription
                                            ->items
                                            ->map(
                                                fn ($item) => [
                                                    'id' =>
                                                        $item
                                                            ->id,

                                                    'medicine_id' =>
                                                        $item
                                                            ->medicine_id,

                                                    'code' =>
                                                        $item
                                                            ->medicine
                                                            ?->code,

                                                    'name' =>
                                                        $item
                                                            ->medicine
                                                            ?->name,

                                                    'generic_name' =>
                                                        $item
                                                            ->medicine
                                                            ?->generic_name,

                                                    'dosage_form' =>
                                                        $item
                                                            ->medicine
                                                            ?->dosage_form,

                                                    'strength' =>
                                                        $item
                                                            ->medicine
                                                            ?->strength,

                                                    'dosage' =>
                                                        $item
                                                            ->dosage,

                                                    'frequency' =>
                                                        $item
                                                            ->frequency,

                                                    'quantity' =>
                                                        $item
                                                            ->quantity,

                                                    'unit' =>
                                                        $item
                                                            ->unit,

                                                    'instruction' =>
                                                        $item
                                                            ->instruction,
                                                ]
                                            )
                                            ->values(),
                                ]
                                : null,

                        /*
                        |------------------------------------------------------
                        | LABORATORY
                        |------------------------------------------------------
                        */

                        'laboratory' =>
                            $laboratoryOrders
                                ->map(
                                    fn ($order) => [
                                        'id' => $order->id,
                                        'lab_number' => $order->lab_number,
                                        'status' => $order->status,
                                        'ordered_at' => $order->ordered_at,
                                        'verified_at' => $order->verified_at,
                                        'items' => $order->items
                                            ->map(
                                                fn ($item) => [
                                                    'id' => $item->id,
                                                    'status' => $item->status,
                                                    'code' => $item->testType?->code,
                                                    'name' => $item->testType?->name,
                                                    'results' => $item->results
                                                        ->map(
                                                            fn ($result) => [
                                                                'id' => $result->id,
                                                                'parameter' => $result->parameter?->name,
                                                                'value' => $result->value,
                                                                'unit' => $result->unit,
                                                                'reference_low' => $result->reference_low,
                                                                'reference_high' => $result->reference_high,
                                                                'reference_text' => $result->reference_text,
                                                                'flag' => $result->flag,
                                                                'verified_at' => $result->verified_at,
                                                            ]
                                                        )
                                                        ->values(),
                                                ]
                                            )
                                            ->values(),
                                    ]
                                )
                                ->values(),
                    ];
                }
            );

        /*
        |--------------------------------------------------------------------------
        | MEDICATION HISTORY
        |--------------------------------------------------------------------------
        |
        | Hanya mengambil obat yang benar-benar tersimpan pada prescription.
        |
        */

        $medications =
            $records
                ->flatMap(
                    function (
                        MedicalRecord $record
                    ) {
                        $visit =
                            $record->visit;

                        $prescription =
                            $visit
                                ?->prescription;

                        if (
                            !$prescription
                        ) {
                            return [];
                        }

                        return
                            $prescription
                                ->items
                                ->map(
                                    fn ($item) => [
                                        'visit_id' =>
                                            $record
                                                ->visit_id,

                                        'visit_number' =>
                                            $visit
                                                ?->visit_number,

                                        'prescription_id' =>
                                            $prescription
                                                ->id,

                                        'prescription_number' =>
                                            $prescription
                                                ->prescription_number,

                                        'prescription_status' =>
                                            $prescription
                                                ->status,

                                        'submitted_at' =>
                                            $prescription
                                                ->submitted_at,

                                        'medicine_id' =>
                                            $item
                                                ->medicine_id,

                                        'code' =>
                                            $item
                                                ->medicine
                                                ?->code,

                                        'name' =>
                                            $item
                                                ->medicine
                                                ?->name,

                                        'generic_name' =>
                                            $item
                                                ->medicine
                                                ?->generic_name,

                                        'strength' =>
                                            $item
                                                ->medicine
                                                ?->strength,

                                        'dosage_form' =>
                                            $item
                                                ->medicine
                                                ?->dosage_form,

                                        'dosage' =>
                                            $item
                                                ->dosage,

                                        'frequency' =>
                                            $item
                                                ->frequency,

                                        'quantity' =>
                                            $item
                                                ->quantity,

                                        'unit' =>
                                            $item
                                                ->unit,

                                        'instruction' =>
                                            $item
                                                ->instruction,
                                    ]
                                );
                    }
                )
                ->values();

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,

            action:
                'medical_record.view',

            module:
                'medical_record',

            description:
                'Pengguna melihat rekam medis pasien.',

            newValues: [
                'patient_id' =>
                    $patient->id,

                'record_count' =>
                    $records->count(),
            ],
        );

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'data' => [
                /*
                |--------------------------------------------------------------------------
                | PATIENT
                |--------------------------------------------------------------------------
                */

                'patient' => [
                    'id' =>
                        $patient->id,

                    'medical_record_number' =>
                        $patient
                            ->medical_record_number,

                    'nik' =>
                        $patient->nik,

                    'name' =>
                        $patient->name,

                    'gender' =>
                        $patient->gender,

                    'date_of_birth' =>
                        $patient
                            ->date_of_birth,
                ],

                /*
                |--------------------------------------------------------------------------
                | SUMMARY
                |--------------------------------------------------------------------------
                */

                'summary' => [
                    'total_visits' =>
                        $records->count(),

                    'completed_visits' =>
                        $records->count(),
                ],

                /*
                |--------------------------------------------------------------------------
                | VISITS
                |--------------------------------------------------------------------------
                */

                'visits' =>
                    $visits,

                /*
                |--------------------------------------------------------------------------
                | MEDICATION HISTORY
                |--------------------------------------------------------------------------
                */

                'medications' =>
                    $medications,

                'medication_history_available' =>
                    true,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        MedicalRecord $medicalRecord
    ): JsonResponse {
        $medicalRecord->load([
            'patient',

            'visit.registration',

            'visit.prescription.items.medicine',
            'visit.laboratoryOrders.items.testType',
            'visit.laboratoryOrders.items.results.parameter',
            'visit.laboratoryOrders.specimens.sampleType',

            'unit',

            'doctor.employee',

            'revisions.creator',
        ]);

        return response()->json([
            'data' =>
                $medicalRecord,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ADD REVISION / ADDENDUM
    |--------------------------------------------------------------------------
    */

    public function addRevision(
        Request $request,
        MedicalRecord $medicalRecord
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $data =
            $request->validate([
                'section' => [
                    'required',
                    'string',
                    'in:general,subjective,objective,assessment,plan,physical_examination,diagnosis,procedure,doctor_notes',
                ],

                'reason' => [
                    'required',
                    'string',
                    'max:2000',
                ],

                'note' => [
                    'required',
                    'string',
                    'max:5000',
                ],
            ]);

        /*
        |--------------------------------------------------------------------------
        | CREATE REVISION
        |--------------------------------------------------------------------------
        */

        $revision =
            DB::transaction(
                function () use (
                    $request,
                    $medicalRecord,
                    $data
                ) {
                    /*
                    |--------------------------------------------------------------------------
                    | LOCK RECORD
                    |--------------------------------------------------------------------------
                    */

                    $lockedRecord =
                        MedicalRecord::query()
                            ->where(
                                'id',
                                $medicalRecord
                                    ->id
                            )
                            ->lockForUpdate()
                            ->firstOrFail();

                    /*
                    |--------------------------------------------------------------------------
                    | NEXT REVISION NUMBER
                    |--------------------------------------------------------------------------
                    */

                    $lastRevision =
                        $lockedRecord
                            ->revisions()
                            ->max(
                                'revision_number'
                            );

                    $nextRevision =
                        ((int)
                            $lastRevision)
                        + 1;

                    /*
                    |--------------------------------------------------------------------------
                    | APPEND ONLY
                    |--------------------------------------------------------------------------
                    */

                    $revision =
                        MedicalRecordRevision::create([
                            'medical_record_id' =>
                                $lockedRecord
                                    ->id,

                            'revision_number' =>
                                $nextRevision,

                            'section' =>
                                $data[
                                    'section'
                                ],

                            'reason' =>
                                $data[
                                    'reason'
                                ],

                            'note' =>
                                $data[
                                    'note'
                                ],

                            'created_by' =>
                                $request
                                    ->user()
                                    ->id,
                        ]);

                    /*
                    |--------------------------------------------------------------------------
                    | METADATA ONLY
                    |--------------------------------------------------------------------------
                    |
                    | Clinical snapshot tidak diubah.
                    |
                    */

                    $lockedRecord->update([
                        'updated_by' =>
                            $request
                                ->user()
                                ->id,
                    ]);

                    return $revision;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | AUDIT
        |--------------------------------------------------------------------------
        */

        AuditLogger::log(
            request: $request,

            action:
                'medical_record.revision.create',

            module:
                'medical_record',

            description:
                'Pengguna menambahkan addendum rekam medis.',

            newValues: [
                'medical_record_id' =>
                    $medicalRecord
                        ->id,

                'revision_number' =>
                    $revision
                        ->revision_number,

                'section' =>
                    $revision
                        ->section,
            ],
        );

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        $revision->load(
            'creator'
        );

        return response()->json([
            'message' =>
                'Addendum rekam medis berhasil ditambahkan.',

            'data' =>
                $revision,
        ], 201);
    }
}