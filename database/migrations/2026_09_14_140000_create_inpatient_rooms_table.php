<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('inpatient_rooms')) {
            return;
        }

        Schema::create('inpatient_rooms', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('room_id')
                ->unique()
                ->constrained('rooms')
                ->restrictOnDelete();

            $table
                ->string('ward_type', 50)
                ->default('inpatient');

            $table
                ->string('room_class', 50)
                ->default('non_class');

            $table
                ->unsignedSmallInteger('bed_capacity')
                ->default(1);

            $table
                ->text('notes')
                ->nullable();

            $table
                ->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index([
                'ward_type',
                'room_class',
                'is_active',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inpatient_rooms');
    }
};
