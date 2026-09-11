<?php

namespace App\Services;

use App\Models\Examination;
use App\Models\MedicalRecord;

class MedicalRecordSnapshotService
{
    public function createFromExamination(
        Examination $examination,
        ?int $actorId = null
    ): MedicalRecord {
        /*
        |--------------------------------------------------------------------------
        | LOAD CLINICAL DATA
        |--------------------------------------------------------------------------
        */

        $examination->loadMissing([
            'visit.patient',
            'visit.unit',
            'visit.registration',
            'doctor.employee',
            'diagnoses.code',
            'procedures.code',
        ]);

        $visit =
            $examination->visit;

        /*
        |--------------------------------------------------------------------------
        | IDEMPOTENT
        |--------------------------------------------------------------------------
        |
        | Kalau request complete terpanggil ulang,
        | jangan membuat rekam medis kedua.
        |
        */

        $existing =
            MedicalRecord::query()
                ->where(
                    'examination_id',
                    $examination->id
                )
                ->first();

        if ($existing) {
            return $existing;
        }

        /*
        |--------------------------------------------------------------------------
        | CLINICAL SNAPSHOT
        |--------------------------------------------------------------------------
        */

        $clinicalSnapshot = [
            'subjective' =>
                $examination->subjective,

            'objective' =>
                $examination->objective,

            'assessment' =>
                $examination->assessment,

            'plan' =>
                $examination->plan,

            'vital_signs' => [
                'systolic' =>
                    $examination->systolic,

                'diastolic' =>
                    $examination->diastolic,

                'heart_rate' =>
                    $examination->heart_rate,

                'respiratory_rate' =>
                    $examination
                        ->respiratory_rate,

                'temperature' =>
                    $examination->temperature,

                'weight' =>
                    $examination->weight,

                'height' =>
                    $examination->height,
            ],

            'physical_examination' =>
                $examination
                    ->physical_examination,

            'doctor_notes' =>
                $examination
                    ->doctor_notes,
        ];

        /*
        |--------------------------------------------------------------------------
        | CODING SNAPSHOT
        |--------------------------------------------------------------------------
        */

        $codingSnapshot = [
            'diagnoses' =>
                $examination
                    ->diagnoses
                    ->map(
                        fn ($diagnosis) => [
                            'id' =>
                                $diagnosis->id,

                            'type' =>
                                $diagnosis->type,

                            'code' =>
                                $diagnosis
                                    ->code
                                    ?->code,

                            'description' =>
                                $diagnosis
                                    ->code
                                    ?->description,

                            'notes' =>
                                $diagnosis->notes,
                        ]
                    )
                    ->values()
                    ->all(),

            'procedures' =>
                $examination
                    ->procedures
                    ->map(
                        fn ($procedure) => [
                            'id' =>
                                $procedure->id,

                            'code' =>
                                $procedure
                                    ->code
                                    ?->code,

                            'description' =>
                                $procedure
                                    ->code
                                    ?->description,

                            'notes' =>
                                $procedure->notes,
                        ]
                    )
                    ->values()
                    ->all(),
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE IMMUTABLE RECORD
        |--------------------------------------------------------------------------
        */

        return MedicalRecord::create([
            'record_number' =>
                'MRD-' .
                $visit->visit_number,

            'patient_id' =>
                $visit->patient_id,

            'visit_id' =>
                $visit->id,

            'examination_id' =>
                $examination->id,

            'doctor_id' =>
                $examination->doctor_id,

            'unit_id' =>
                $visit->unit_id,

            'clinical_snapshot' =>
                $clinicalSnapshot,

            'coding_snapshot' =>
                $codingSnapshot,

            'finalized_at' =>
                $examination
                    ->completed_at
                ?? now(),

            'created_by' =>
                $actorId,

            'updated_by' =>
                $actorId,
        ]);
    }
}