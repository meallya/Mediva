<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | HALAL STATUS
        |--------------------------------------------------------------------------
        */

        if (
            !Schema::hasColumn(
                'medicines',
                'halal_status'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table
                        ->string(
                            'halal_status',
                            30
                        )
                        ->default(
                            'unverified'
                        )
                        ->after(
                            'manufacturer'
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CERTIFICATE NUMBER
        |--------------------------------------------------------------------------
        */

        if (
            !Schema::hasColumn(
                'medicines',
                'halal_certificate_number'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table
                        ->string(
                            'halal_certificate_number',
                            150
                        )
                        ->nullable()
                        ->after(
                            'halal_status'
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | VALID UNTIL
        |--------------------------------------------------------------------------
        */

        if (
            !Schema::hasColumn(
                'medicines',
                'halal_valid_until'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table
                        ->date(
                            'halal_valid_until'
                        )
                        ->nullable()
                        ->after(
                            'halal_certificate_number'
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NOTES
        |--------------------------------------------------------------------------
        */

        if (
            !Schema::hasColumn(
                'medicines',
                'halal_notes'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table
                        ->text(
                            'halal_notes'
                        )
                        ->nullable()
                        ->after(
                            'halal_valid_until'
                        );
                }
            );
        }
    }

    public function down(): void
    {
        if (
            Schema::hasColumn(
                'medicines',
                'halal_notes'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table->dropColumn(
                        'halal_notes'
                    );
                }
            );
        }

        if (
            Schema::hasColumn(
                'medicines',
                'halal_valid_until'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table->dropColumn(
                        'halal_valid_until'
                    );
                }
            );
        }

        if (
            Schema::hasColumn(
                'medicines',
                'halal_certificate_number'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table->dropColumn(
                        'halal_certificate_number'
                    );
                }
            );
        }

        if (
            Schema::hasColumn(
                'medicines',
                'halal_status'
            )
        ) {
            Schema::table(
                'medicines',
                function (Blueprint $table) {
                    $table->dropColumn(
                        'halal_status'
                    );
                }
            );
        }
    }
};