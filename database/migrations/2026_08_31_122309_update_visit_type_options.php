<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | REGISTRATIONS
        |--------------------------------------------------------------------------
        */

        DB::statement("
            ALTER TABLE registrations
            MODIFY visit_type ENUM(
                'outpatient',
                'emergency',
                'inpatient',
                'medical_checkup',
                'day_care',
                'home_care',
                'telemedicine'
            ) NOT NULL
        ");

        /*
        |--------------------------------------------------------------------------
        | VISITS
        |--------------------------------------------------------------------------
        */

        DB::statement("
            ALTER TABLE visits
            MODIFY visit_type ENUM(
                'outpatient',
                'emergency',
                'inpatient',
                'medical_checkup',
                'day_care',
                'home_care',
                'telemedicine'
            ) NOT NULL
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE registrations
            MODIFY visit_type ENUM(
                'outpatient',
                'emergency',
                'inpatient'
            ) NOT NULL
        ");

        DB::statement("
            ALTER TABLE visits
            MODIFY visit_type ENUM(
                'outpatient',
                'emergency',
                'inpatient'
            ) NOT NULL
        ");
    }
};