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
        | ICD-10 MASTER
        |--------------------------------------------------------------------------
        */

        Schema::create('icd10_codes', function (Blueprint $table) {
            $table->id();

            $table
                ->string('code', 20)
                ->unique();

            $table
                ->string('description', 500);

            $table
                ->string('category', 255)
                ->nullable();

            $table
                ->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index('description');
        });

        /*
        |--------------------------------------------------------------------------
        | ICD-9-CM MASTER
        |--------------------------------------------------------------------------
        */

        Schema::create('icd9cm_codes', function (Blueprint $table) {
            $table->id();

            $table
                ->string('code', 20)
                ->unique();

            $table
                ->string('description', 500);

            $table
                ->string('category', 255)
                ->nullable();

            $table
                ->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index('description');
        });

        /*
        |--------------------------------------------------------------------------
        | EXAMINATION DIAGNOSES
        |--------------------------------------------------------------------------
        */

        Schema::create('examination_diagnoses', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('examination_id')
                ->constrained('examinations')
                ->restrictOnDelete();

            $table
                ->foreignId('icd10_code_id')
                ->constrained('icd10_codes')
                ->restrictOnDelete();

            $table
                ->enum(
                    'type',
                    [
                        'primary',
                        'secondary',
                    ]
                );

            $table
                ->text('notes')
                ->nullable();

            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique([
                'examination_id',
                'icd10_code_id',
            ]);

            $table->index([
                'examination_id',
                'type',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | EXAMINATION PROCEDURES
        |--------------------------------------------------------------------------
        */

        Schema::create('examination_procedures', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('examination_id')
                ->constrained('examinations')
                ->restrictOnDelete();

            $table
                ->foreignId('icd9cm_code_id')
                ->constrained('icd9cm_codes')
                ->restrictOnDelete();

            $table
                ->text('notes')
                ->nullable();

            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique([
                'examination_id',
                'icd9cm_code_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'examination_procedures'
        );

        Schema::dropIfExists(
            'examination_diagnoses'
        );

        Schema::dropIfExists(
            'icd9cm_codes'
        );

        Schema::dropIfExists(
            'icd10_codes'
        );
    }
};