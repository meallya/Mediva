<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('asset_categories')) {
            Schema::create('asset_categories', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name', 150);
                $table->enum('asset_type', ['general_asset', 'medical_equipment'])->default('general_asset');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('assets')) {
            Schema::create('assets', function (Blueprint $table) {
                $table->id();
                $table->string('asset_code', 80)->unique();
                $table->string('name', 200);
                $table->foreignId('asset_category_id')->constrained('asset_categories')->restrictOnDelete();
                $table->enum('asset_type', ['general_asset', 'medical_equipment'])->default('general_asset');
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
                $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
                $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->string('serial_number', 150)->nullable()->unique();
                $table->string('brand', 120)->nullable();
                $table->string('model', 120)->nullable();
                $table->date('acquisition_date')->nullable();
                $table->decimal('acquisition_cost', 15, 2)->default(0);
                $table->date('warranty_until')->nullable();
                $table->enum('condition', ['good', 'minor_damage', 'major_damage', 'out_of_service'])->default('good');
                $table->enum('status', ['available', 'in_use', 'maintenance', 'retired', 'disposed'])->default('available');
                $table->boolean('calibration_required')->default(false);
                $table->date('last_calibration_date')->nullable();
                $table->date('next_calibration_date')->nullable();
                $table->string('medical_device_registration', 150)->nullable();
                $table->string('risk_class', 50)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['asset_type', 'status', 'is_active']);
                $table->index(['unit_id', 'room_id']);
                $table->index(['next_calibration_date', 'calibration_required']);
            });
        }

        if (!Schema::hasTable('asset_maintenances')) {
            Schema::create('asset_maintenances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
                $table->enum('maintenance_type', ['preventive', 'corrective', 'calibration', 'inspection']);
                $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
                $table->date('scheduled_date')->nullable();
                $table->date('performed_date')->nullable();
                $table->date('next_due_date')->nullable();
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
                $table->decimal('cost', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['asset_id', 'status', 'scheduled_date']);
            });
        }

        if (!Schema::hasTable('asset_mutations')) {
            Schema::create('asset_mutations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
                $table->foreignId('from_unit_id')->nullable()->constrained('units')->nullOnDelete();
                $table->foreignId('to_unit_id')->nullable()->constrained('units')->nullOnDelete();
                $table->foreignId('from_room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->foreignId('to_room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->date('mutation_date');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_mutations');
        Schema::dropIfExists('asset_maintenances');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('asset_categories');
    }
};
