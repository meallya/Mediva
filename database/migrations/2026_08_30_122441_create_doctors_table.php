<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('employee_id')
                ->unique()
                ->constrained('employees')
                ->restrictOnDelete();

            $table
                ->string('sip_number', 100)
                ->nullable()
                ->unique();

            $table
                ->string('specialization', 150)
                ->nullable();

            $table
                ->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};