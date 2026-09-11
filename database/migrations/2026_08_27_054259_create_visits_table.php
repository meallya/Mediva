<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | VISIT NUMBER
            |--------------------------------------------------------------------------
            */

            $table
                ->string('visit_number', 30)
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | PATIENT
            |--------------------------------------------------------------------------
            */

            $table
                ->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | SERVICE UNIT
            |--------------------------------------------------------------------------
            |
            | Untuk sekarang unit menjadi poli/unit pelayanan.
            |
            */

            $table
                ->foreignId('unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | VISIT TYPE
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'visit_type',
                [
                    'outpatient',
                    'emergency',
                    'inpatient',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | DOCTOR
            |--------------------------------------------------------------------------
            |
            | Belum kita FK-kan karena master doctors belum dibangun.
            |
            | Nanti doctor_id akan ditambahkan setelah modul Master Doctor
            | selesai supaya relasinya tidak salah.
            |
            */

            $table
                ->unsignedBigInteger('doctor_id')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | PAYMENT METHOD
            |--------------------------------------------------------------------------
            |
            | Sama seperti doctor_id.
            |
            | Master payment_methods belum kita bangun.
            | Untuk sekarang nullable dan belum FK.
            |
            */

            $table
                ->unsignedBigInteger('payment_method_id')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | VISIT STATUS
            |--------------------------------------------------------------------------
            */

            $table
                ->enum(
                    'status',
                    [
                        'registered',
                        'waiting',
                        'in_service',
                        'completed',
                        'cancelled',
                    ]
                )
                ->default('waiting');

            /*
            |--------------------------------------------------------------------------
            | VISIT TIME
            |--------------------------------------------------------------------------
            */

            $table
                ->dateTime('started_at')
                ->nullable();

            $table
                ->dateTime('completed_at')
                ->nullable();

            $table
                ->dateTime('cancelled_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */

            $table
                ->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | SATUSEHAT PREPARATION
            |--------------------------------------------------------------------------
            |
            | Sudah disebut di blueprint supaya disiapkan dari awal.
            |
            */

            $table
                ->string(
                    'ihs_encounter_id',
                    100
                )
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | AUDIT ACTOR
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

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index([
                'patient_id',
                'status',
            ]);

            $table->index([
                'unit_id',
                'status',
            ]);

            $table->index([
                'visit_type',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'visits'
        );
    }
};