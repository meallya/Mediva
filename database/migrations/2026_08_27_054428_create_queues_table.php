<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queues', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | VISIT
            |--------------------------------------------------------------------------
            */

            $table
                ->foreignId('visit_id')
                ->constrained('visits')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | UNIT
            |--------------------------------------------------------------------------
            */

            $table
                ->foreignId('unit_id')
                ->constrained('units')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | SERVICE TYPE
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'service_type',
                [
                    'registration',
                    'clinic',
                    'pharmacy',
                    'cashier',
                    'laboratory',
                    'radiology',
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | QUEUE NUMBER
            |--------------------------------------------------------------------------
            */

            $table
                ->string(
                    'queue_number',
                    10
                );

            /*
            |--------------------------------------------------------------------------
            | PRIORITY
            |--------------------------------------------------------------------------
            |
            | 1 = paling tinggi
            | 5 = normal
            |
            */

            $table
                ->unsignedTinyInteger(
                    'priority'
                )
                ->default(5);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'status',
                [
                    'waiting',
                    'called',
                    'in_service',
                    'completed',
                    'skipped',
                ]
            )->default(
                'waiting'
            );

            /*
            |--------------------------------------------------------------------------
            | TIME
            |--------------------------------------------------------------------------
            */

            $table
                ->dateTime('taken_at')
                ->nullable();

            $table
                ->dateTime('called_at')
                ->nullable();

            $table
                ->dateTime('started_at')
                ->nullable();

            $table
                ->dateTime('completed_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | COUNTER
            |--------------------------------------------------------------------------
            */

            $table
                ->string(
                    'counter',
                    20
                )
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | BOOKING CODE
            |--------------------------------------------------------------------------
            |
            | Disiapkan untuk BPJS Antrean Online nanti.
            |
            */

            $table
                ->string(
                    'booking_code',
                    50
                )
                ->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'unit_id',
                'service_type',
                'status',
            ]);

            $table->index([
                'visit_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'queues'
        );
    }
};