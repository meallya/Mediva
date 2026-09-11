<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | VISITS → REGISTRATION
        |--------------------------------------------------------------------------
        */

        Schema::table('visits', function (Blueprint $table) {
            $table
                ->foreignId('registration_id')
                ->nullable()
                ->after('id')
                ->constrained('registrations')
                ->restrictOnDelete();

            $table->unique(
                'registration_id',
                'visits_registration_id_unique'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | QUEUE STATUS
        |--------------------------------------------------------------------------
        |
        | Tambahkan cancelled karena antrean juga harus ikut batal
        | ketika pendaftaran dibatalkan.
        |
        */

        DB::statement("
            ALTER TABLE queues
            MODIFY status ENUM(
                'waiting',
                'called',
                'in_service',
                'completed',
                'skipped',
                'cancelled'
            )
            NOT NULL DEFAULT 'waiting'
        ");
    }

    public function down(): void
    {
        DB::table('queues')
            ->where('status', 'cancelled')
            ->update([
                'status' => 'skipped',
            ]);

        DB::statement("
            ALTER TABLE queues
            MODIFY status ENUM(
                'waiting',
                'called',
                'in_service',
                'completed',
                'skipped'
            )
            NOT NULL DEFAULT 'waiting'
        ");

        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign([
                'registration_id',
            ]);

            $table->dropUnique(
                'visits_registration_id_unique'
            );

            $table->dropColumn(
                'registration_id'
            );
        });
    }
};