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
        | ADD COLUMN IF NOT EXISTS
        |--------------------------------------------------------------------------
        */

        if (! Schema::hasColumn('visits', 'registration_id')) {
            Schema::table('visits', function (Blueprint $table) {
                $table
                    ->unsignedBigInteger('registration_id')
                    ->nullable()
                    ->after('id');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | ADD FOREIGN KEY IF NOT EXISTS
        |--------------------------------------------------------------------------
        */

        $foreignKeyExists = DB::table(
            'information_schema.KEY_COLUMN_USAGE'
        )
            ->whereRaw(
                'TABLE_SCHEMA = DATABASE()'
            )
            ->where(
                'TABLE_NAME',
                'visits'
            )
            ->where(
                'COLUMN_NAME',
                'registration_id'
            )
            ->where(
                'REFERENCED_TABLE_NAME',
                'registrations'
            )
            ->exists();

        if (! $foreignKeyExists) {
            DB::statement("
                ALTER TABLE visits
                ADD CONSTRAINT visits_registration_id_foreign
                FOREIGN KEY (registration_id)
                REFERENCES registrations(id)
                ON DELETE RESTRICT
            ");
        }

        /*
        |--------------------------------------------------------------------------
        | ADD UNIQUE INDEX IF NOT EXISTS
        |--------------------------------------------------------------------------
        */

        $uniqueExists = DB::table(
            'information_schema.STATISTICS'
        )
            ->whereRaw(
                'TABLE_SCHEMA = DATABASE()'
            )
            ->where(
                'TABLE_NAME',
                'visits'
            )
            ->where(
                'COLUMN_NAME',
                'registration_id'
            )
            ->where(
                'NON_UNIQUE',
                0
            )
            ->exists();

        if (! $uniqueExists) {
            DB::statement("
                ALTER TABLE visits
                ADD UNIQUE INDEX visits_registration_id_unique
                (registration_id)
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('visits', 'registration_id')) {
            $foreignKeyExists = DB::table(
                'information_schema.KEY_COLUMN_USAGE'
            )
                ->whereRaw(
                    'TABLE_SCHEMA = DATABASE()'
                )
                ->where(
                    'TABLE_NAME',
                    'visits'
                )
                ->where(
                    'COLUMN_NAME',
                    'registration_id'
                )
                ->where(
                    'REFERENCED_TABLE_NAME',
                    'registrations'
                )
                ->exists();

            if ($foreignKeyExists) {
                DB::statement("
                    ALTER TABLE visits
                    DROP FOREIGN KEY visits_registration_id_foreign
                ");
            }

            $uniqueExists = DB::table(
                'information_schema.STATISTICS'
            )
                ->whereRaw(
                    'TABLE_SCHEMA = DATABASE()'
                )
                ->where(
                    'TABLE_NAME',
                    'visits'
                )
                ->where(
                    'INDEX_NAME',
                    'visits_registration_id_unique'
                )
                ->exists();

            if ($uniqueExists) {
                DB::statement("
                    ALTER TABLE visits
                    DROP INDEX visits_registration_id_unique
                ");
            }

            Schema::table('visits', function (Blueprint $table) {
                $table->dropColumn(
                    'registration_id'
                );
            });
        }
    }
};