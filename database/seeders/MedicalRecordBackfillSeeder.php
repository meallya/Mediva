<?php

namespace Database\Seeders;

use App\Models\Examination;
use App\Services\MedicalRecordSnapshotService;
use Illuminate\Database\Seeder;

class MedicalRecordBackfillSeeder extends Seeder
{
    public function run(
        MedicalRecordSnapshotService $service
    ): void {
        $examinations =
            Examination::query()
                ->where(
                    'status',
                    'completed'
                )
                ->with([
                    'visit.patient',
                    'visit.unit',
                    'visit.registration',
                    'doctor.employee',
                    'diagnoses.code',
                    'procedures.code',
                ])
                ->get();

        foreach (
            $examinations
            as $examination
        ) {
            $service
                ->createFromExamination(
                    $examination,
                    $examination
                        ->updated_by
                    ?? $examination
                        ->created_by
                );
        }
    }
}