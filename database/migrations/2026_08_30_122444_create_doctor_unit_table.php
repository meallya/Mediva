<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_unit', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('doctor_id')
                ->constrained('doctors')
                ->cascadeOnDelete();

            $table
                ->foreignId('unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            $table->timestamps();

            $table->unique([
                'doctor_id',
                'unit_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_unit');
    }
};