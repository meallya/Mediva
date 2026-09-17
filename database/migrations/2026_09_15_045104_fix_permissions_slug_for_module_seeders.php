<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        if (!Schema::hasColumn('permissions', 'slug')) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | 1. Izinkan insert permission tanpa slug
        |--------------------------------------------------------------------------
        */

        Schema::table('permissions', function (Blueprint $table) {
            $table->string('slug')->nullable()->change();
        });

        /*
        |--------------------------------------------------------------------------
        | 2. Perbaiki data lama kalau ada slug kosong
        |--------------------------------------------------------------------------
        */

        DB::table('permissions')
            ->whereNull('slug')
            ->orWhere('slug', '')
            ->get()
            ->each(function ($permission) {
                DB::table('permissions')
                    ->where('id', $permission->id)
                    ->update([
                        'slug' => $permission->name,
                    ]);
            });

        /*
        |--------------------------------------------------------------------------
        | 3. Trigger setelah INSERT
        |--------------------------------------------------------------------------
        |
        | Seeder lama:
        |
        | name = operating_room.view
        | module = operating_room
        |
        | Maka setelah insert:
        |
        | slug = operating_room.view
        |
        */

        DB::unprepared('
            DROP TRIGGER IF EXISTS permissions_auto_slug_after_insert
        ');

        DB::unprepared('
            CREATE TRIGGER permissions_auto_slug_after_insert
            AFTER INSERT ON permissions
            FOR EACH ROW
            BEGIN
                IF NEW.slug IS NULL OR NEW.slug = "" THEN
                    UPDATE permissions
                    SET slug = NEW.name
                    WHERE id = NEW.id;
                END IF;
            END
        ');
    }

    public function down(): void
    {
        DB::unprepared('
            DROP TRIGGER IF EXISTS permissions_auto_slug_after_insert
        ');

        DB::table('permissions')
            ->whereNull('slug')
            ->update([
                'slug' => 'unknown-permission'
            ]);

        Schema::table('permissions', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });
    }
};