<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table
                ->foreign('doctor_id')
                ->references('id')
                ->on('doctors')
                ->restrictOnDelete();

            $table
                ->foreign('payment_method_id')
                ->references('id')
                ->on('payment_methods')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign([
                'doctor_id',
            ]);

            $table->dropForeign([
                'payment_method_id',
            ]);
        });
    }
};