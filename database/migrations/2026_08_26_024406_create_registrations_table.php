<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | REGISTRATION NUMBER
            |--------------------------------------------------------------------------
            |
            | Contoh:
            | REG-20260826-000001
            |
            */

            $table
                ->string('registration_number', 30)
                ->nullable()
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
            | DESTINATION UNIT
            |--------------------------------------------------------------------------
            |
            | Contoh:
            | Poli Umum
            | IGD
            |
            */

            $table
                ->foreignId('unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | VISIT
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'visit_type',
                [
                    'outpatient',
                    'emergency',
                ]
            );

            $table
                ->text('complaint')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table
                ->enum(
                    'status',
                    [
                        'waiting',
                        'in_service',
                        'completed',
                        'cancelled',
                    ]
                )
                ->default('waiting');

            /*
            |--------------------------------------------------------------------------
            | REGISTRATION TIME
            |--------------------------------------------------------------------------
            */

            $table->timestamp(
                'registered_at'
            );

            /*
            |--------------------------------------------------------------------------
            | AUDIT USER
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

            $table->index(
                'registered_at'
            );

            $table->index(
                'status'
            );

            $table->index(
                [
                    'unit_id',
                    'status',
                ]
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'registrations'
        );
    }
};