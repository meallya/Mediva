<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | MEDICAL RECORDS
        |--------------------------------------------------------------------------
        */

        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();

            $table
                ->string('record_number')
                ->unique();

            $table
                ->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            $table
                ->foreignId('visit_id')
                ->unique()
                ->constrained('visits')
                ->restrictOnDelete();

            $table
                ->foreignId('examination_id')
                ->unique()
                ->constrained('examinations')
                ->restrictOnDelete();

            $table
                ->foreignId('doctor_id')
                ->nullable()
                ->constrained('doctors')
                ->nullOnDelete();

            $table
                ->foreignId('unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | IMMUTABLE SNAPSHOT
            |--------------------------------------------------------------------------
            */

            $table->json(
                'clinical_snapshot'
            );

            $table->json(
                'coding_snapshot'
            );

            $table
                ->timestamp('finalized_at');

            /*
            |--------------------------------------------------------------------------
            | ACTOR
            |--------------------------------------------------------------------------
            */

            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table
                ->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index([
                'patient_id',
                'finalized_at',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | MEDICAL RECORD REVISIONS / ADDENDUM
        |--------------------------------------------------------------------------
        */

        Schema::create(
            'medical_record_revisions',
            function (Blueprint $table) {
                $table->id();

                $table
                    ->foreignId(
                        'medical_record_id'
                    )
                    ->constrained(
                        'medical_records'
                    )
                    ->restrictOnDelete();

                $table
                    ->unsignedInteger(
                        'revision_number'
                    );

                $table
                    ->enum(
                        'section',
                        [
                            'general',
                            'subjective',
                            'objective',
                            'assessment',
                            'plan',
                            'physical_examination',
                            'diagnosis',
                            'procedure',
                            'doctor_notes',
                        ]
                    )
                    ->default('general');

                $table->text(
                    'reason'
                );

                $table->text(
                    'note'
                );

                $table
                    ->foreignId(
                        'created_by'
                    )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->unique(
    [
        'medical_record_id',
        'revision_number',
    ],
    'mr_revision_unique'
);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'medical_record_revisions'
        );

        Schema::dropIfExists(
            'medical_records'
        );
    }
};