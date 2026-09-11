<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
    }
};