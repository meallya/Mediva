<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();

            $table
                ->string('code')
                ->unique();

            $table->string('name');

            $table
                ->string('generic_name')
                ->nullable();

            $table
                ->string('dosage_form')
                ->nullable();

            $table
                ->string('strength')
                ->nullable();

            $table
                ->string('unit')
                ->nullable();

            $table
                ->string('manufacturer')
                ->nullable();

            $table
                ->boolean('is_active')
                ->default(true);

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
                'name',
                'is_active',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};