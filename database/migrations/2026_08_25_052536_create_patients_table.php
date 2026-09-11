<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();

            $table->string(
                'medical_record_number',
                20
            )->unique();

            $table->string(
                'nik',
                16
            )->nullable()->unique();

            $table->string('name');

            $table->enum('gender', [
                'male',
                'female',
            ]);

            $table->date('date_of_birth');

            $table->text('address')
                ->nullable();

            $table->string(
                'phone',
                20
            )->nullable();

            $table->enum(
                'blood_type',
                [
                    'A',
                    'B',
                    'AB',
                    'O',
                ]
            )->nullable();

            $table->string(
                'emergency_contact'
            )->nullable();

            $table->string(
                'ihs_number'
            )->nullable()->unique();

            $table->boolean(
                'is_active'
            )->default(true);

            $table->foreignId(
                'created_by'
            )
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId(
                'updated_by'
            )
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->softDeletes();

            $table->index('name');
            $table->index('date_of_birth');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'patients'
        );
    }
};