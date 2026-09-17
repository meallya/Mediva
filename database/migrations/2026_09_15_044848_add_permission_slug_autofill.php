<?php

use Illuminate\Database\Migrations\Migration;
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
        | Auto Fill Permission Slug
        |--------------------------------------------------------------------------
        |
        | Struktur permission MEDIVA mewajibkan kolom slug.
        | Beberapa module seeder hanya mengirim kolom name.
        |
        | Contoh:
        |
        | name : operating_room.view
        | slug : operating_room.view
        |
        */

        DB::unprepared('
            DROP TRIGGER IF EXISTS permissions_auto_slug_before_insert
        ');

        DB::unprepared('
            CREATE TRIGGER permissions_auto_slug_before_insert
            BEFORE INSERT ON permissions
            FOR EACH ROW
            BEGIN
                IF NEW.slug IS NULL OR NEW.slug = "" THEN
                    SET NEW.slug = NEW.name;
                END IF;
            END
        ');
    }

    public function down(): void
    {
        DB::unprepared('
            DROP TRIGGER IF EXISTS permissions_auto_slug_before_insert
        ');
    }
};