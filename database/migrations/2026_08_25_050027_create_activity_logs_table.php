<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('role_assignment_id')
                ->nullable()
                ->constrained('role_assignments')
                ->nullOnDelete();

            $table->string('action', 100);

            $table->string('module', 100)
                ->nullable();

            $table->text('description')
                ->nullable();

            $table->string('method', 10)
                ->nullable();

            $table->string('endpoint')
                ->nullable();

            $table->ipAddress('ip_address')
                ->nullable();

            $table->text('user_agent')
                ->nullable();

            $table->json('old_values')
                ->nullable();

            $table->json('new_values')
                ->nullable();

            $table->timestamp('created_at')
                ->useCurrent();

            $table->index('action');
            $table->index('module');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};