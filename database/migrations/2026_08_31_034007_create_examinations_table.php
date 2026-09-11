<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examinations', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATION
            |--------------------------------------------------------------------------
            */

            $table
                ->foreignId('visit_id')
                ->unique()
                ->constrained('visits')
                ->restrictOnDelete();

            $table
                ->foreignId('doctor_id')
                ->constrained('doctors')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | SOAP
            |--------------------------------------------------------------------------
            */

            $table
                ->text('subjective')
                ->nullable();

            $table
                ->text('objective')
                ->nullable();

            $table
                ->text('assessment')
                ->nullable();

            $table
                ->text('plan')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | VITAL SIGNS
            |--------------------------------------------------------------------------
            */

            $table
                ->unsignedSmallInteger('systolic')
                ->nullable();

            $table
                ->unsignedSmallInteger('diastolic')
                ->nullable();

            $table
                ->unsignedSmallInteger('heart_rate')
                ->nullable();

            $table
                ->unsignedSmallInteger('respiratory_rate')
                ->nullable();

            $table
                ->decimal(
                    'temperature',
                    4,
                    1
                )
                ->nullable();

            $table
                ->decimal(
                    'weight',
                    6,
                    2
                )
                ->nullable();

            $table
                ->decimal(
                    'height',
                    6,
                    2
                )
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | EXAMINATION
            |--------------------------------------------------------------------------
            */

            $table
                ->text('physical_examination')
                ->nullable();

            $table
                ->text('doctor_notes')
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
                        'draft',
                        'completed',
                    ]
                )
                ->default('draft');

            $table
                ->timestamp('completed_at')
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

            $table->index([
                'doctor_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'examinations'
        );
    }
};