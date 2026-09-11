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
        | PRESCRIPTIONS
        |--------------------------------------------------------------------------
        */

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();

            $table
                ->string('prescription_number')
                ->unique();

            $table
                ->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            $table
                ->foreignId('visit_id')
                ->constrained('visits')
                ->restrictOnDelete();

            $table
                ->foreignId('examination_id')
                ->constrained('examinations')
                ->restrictOnDelete();

            $table
                ->foreignId('doctor_id')
                ->constrained('doctors')
                ->restrictOnDelete();

            $table
                ->enum('status', [
                    'draft',
                    'submitted',
                    'processing',
                    'ready',
                    'dispensed',
                    'cancelled',
                ])
                ->default('draft');

            $table
                ->text('doctor_notes')
                ->nullable();

            $table
                ->timestamp('submitted_at')
                ->nullable();

            $table
                ->timestamp('dispensed_at')
                ->nullable();

            $table
                ->timestamp('cancelled_at')
                ->nullable();

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

            /*
            |--------------------------------------------------------------------------
            | 1 RESEP AKTIF PER PEMERIKSAAN
            |--------------------------------------------------------------------------
            */

            $table->unique(
                'examination_id',
                'rx_exam_unique'
            );

            $table->index([
                'status',
                'created_at',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | PRESCRIPTION ITEMS
        |--------------------------------------------------------------------------
        */

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('prescription_id')
                ->constrained('prescriptions')
                ->cascadeOnDelete();

            $table
                ->foreignId('medicine_id')
                ->constrained('medicines')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INSTRUKSI DOKTER
            |--------------------------------------------------------------------------
            |
            | MEDIVA tidak menghitung atau mengarang dosis.
            | Seluruh nilai ini diisi dokter.
            |
            */

            $table
                ->string('dosage')
                ->nullable();

            $table
                ->string('frequency')
                ->nullable();

            $table
                ->decimal(
                    'quantity',
                    12,
                    2
                );

            $table
                ->string('unit')
                ->nullable();

            $table
                ->text('instruction')
                ->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'prescription_id',
                    'medicine_id',
                ],
                'rx_item_medicine_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'prescription_items'
        );

        Schema::dropIfExists(
            'prescriptions'
        );
    }
};