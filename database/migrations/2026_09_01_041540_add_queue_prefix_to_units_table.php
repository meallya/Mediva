<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table
                ->string('queue_prefix', 10)
                ->nullable()
                ->unique()
                ->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropUnique([
                'queue_prefix',
            ]);

            $table->dropColumn(
                'queue_prefix'
            );
        });
    }
};