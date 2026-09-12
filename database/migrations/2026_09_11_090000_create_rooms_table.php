<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('rooms')) {
            return;
        }

        Schema::create('rooms', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table
                ->string('code', 50)
                ->unique();

            $table
                ->string('name', 150);

            $table
                ->string('room_type', 50)
                ->default('other');

            $table
                ->string('floor', 50)
                ->nullable();

            $table
                ->unsignedSmallInteger('capacity')
                ->default(1);

            $table
                ->text('notes')
                ->nullable();

            $table
                ->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index([
                'unit_id',
                'room_type',
                'is_active',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
