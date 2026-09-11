<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('role_assignments', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')
            ->constrained('users')
            ->cascadeOnDelete();

        $table->foreignId('role_id')
            ->constrained('roles')
            ->cascadeOnDelete();

        $table->foreignId('unit_id')
            ->nullable()
            ->constrained('units')
            ->nullOnDelete();

        $table->boolean('is_default')->default(false);
        $table->boolean('is_active')->default(true);

        $table->timestamps();

        $table->unique(
            ['user_id', 'role_id', 'unit_id'],
            'role_assignment_unique'
        );
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_assignments');
    }
};
