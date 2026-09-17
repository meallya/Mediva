<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('laboratory_sample_types')) {
            Schema::create('laboratory_sample_types', function (Blueprint $table) {
                $table->id();
                $table->string('code', 30)->unique();
                $table->string('name', 120);
                $table->string('container', 120)->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('laboratory_test_types')) {
            Schema::create('laboratory_test_types', function (Blueprint $table) {
                $table->id();
                $table->string('code', 40)->unique();
                $table->string('name', 160);
                $table->string('category', 100)->nullable();

                $table->foreignId('sample_type_id')
                    ->nullable()
                    ->constrained('laboratory_sample_types')
                    ->nullOnDelete();

                $table->decimal('price', 15, 2)->default(0);
                $table->unsignedInteger('turnaround_minutes')->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();
                $table->index(['category', 'is_active'], 'lab_test_category_active_idx');
            });
        }

        if (!Schema::hasTable('laboratory_parameters')) {
            Schema::create('laboratory_parameters', function (Blueprint $table) {
                $table->id();
                $table->foreignId('test_type_id')
                    ->constrained('laboratory_test_types')
                    ->cascadeOnDelete();

                $table->string('code', 40);
                $table->string('name', 160);
                $table->enum('data_type', ['numeric', 'text'])->default('numeric');
                $table->string('unit', 40)->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(
                    ['test_type_id', 'code'],
                    'lab_param_test_code_unique'
                );
                $table->index(['test_type_id', 'sort_order'], 'lab_param_sort_idx');
            });
        }

        if (!Schema::hasTable('laboratory_reference_ranges')) {
            Schema::create('laboratory_reference_ranges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parameter_id')
                    ->constrained('laboratory_parameters')
                    ->cascadeOnDelete();

                $table->enum('gender', ['all', 'male', 'female'])->default('all');
                $table->unsignedInteger('age_min_months')->nullable();
                $table->unsignedInteger('age_max_months')->nullable();
                $table->decimal('min_value', 16, 4)->nullable();
                $table->decimal('max_value', 16, 4)->nullable();
                $table->string('reference_text', 255)->nullable();
                $table->decimal('critical_min', 16, 4)->nullable();
                $table->decimal('critical_max', 16, 4)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(
                    ['parameter_id', 'gender', 'is_active'],
                    'lab_ref_param_gender_active_idx'
                );
            });
        }

        if (!Schema::hasTable('laboratory_orders')) {
            Schema::create('laboratory_orders', function (Blueprint $table) {
                $table->id();
                $table->string('lab_number', 60)->unique();

                $table->foreignId('visit_id')
                    ->constrained('visits')
                    ->restrictOnDelete();

                $table->foreignId('patient_id')
                    ->constrained('patients')
                    ->restrictOnDelete();

                $table->foreignId('doctor_id')
                    ->nullable()
                    ->constrained('doctors')
                    ->nullOnDelete();

                $table->foreignId('requesting_unit_id')
                    ->nullable()
                    ->constrained('units')
                    ->nullOnDelete();

                $table->enum('status', [
                    'draft',
                    'submitted',
                    'collected',
                    'in_process',
                    'pending_verification',
                    'completed',
                    'cancelled',
                ])->default('draft');

                $table->text('clinical_notes')->nullable();
                $table->dateTime('ordered_at')->nullable();
                $table->dateTime('collected_at')->nullable();
                $table->dateTime('processing_started_at')->nullable();
                $table->dateTime('submitted_for_verification_at')->nullable();
                $table->dateTime('verified_at')->nullable();
                $table->dateTime('cancelled_at')->nullable();
                $table->text('cancellation_reason')->nullable();

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('verified_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->index(['status', 'ordered_at'], 'lab_order_status_date_idx');
                $table->index(['patient_id', 'ordered_at'], 'lab_order_patient_date_idx');
                $table->index(['visit_id', 'status'], 'lab_order_visit_status_idx');
            });
        }

        if (!Schema::hasTable('laboratory_order_items')) {
            Schema::create('laboratory_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('laboratory_order_id')
                    ->constrained('laboratory_orders')
                    ->cascadeOnDelete();

                $table->foreignId('test_type_id')
                    ->constrained('laboratory_test_types')
                    ->restrictOnDelete();

                $table->enum('status', [
                    'pending',
                    'in_process',
                    'pending_verification',
                    'completed',
                    'cancelled',
                ])->default('pending');

                $table->decimal('price', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(
                    ['laboratory_order_id', 'test_type_id'],
                    'lab_order_test_unique'
                );
                $table->index(['laboratory_order_id', 'status'], 'lab_item_order_status_idx');
            });
        }

        if (!Schema::hasTable('laboratory_specimens')) {
            Schema::create('laboratory_specimens', function (Blueprint $table) {
                $table->id();
                $table->string('specimen_number', 70)->unique();

                $table->foreignId('laboratory_order_id')
                    ->constrained('laboratory_orders')
                    ->cascadeOnDelete();

                $table->foreignId('laboratory_order_item_id')
                    ->nullable()
                    ->constrained('laboratory_order_items')
                    ->cascadeOnDelete();

                $table->foreignId('sample_type_id')
                    ->nullable()
                    ->constrained('laboratory_sample_types')
                    ->nullOnDelete();

                $table->enum('status', [
                    'pending',
                    'collected',
                    'received',
                    'rejected',
                ])->default('pending');

                $table->dateTime('collected_at')->nullable();
                $table->dateTime('received_at')->nullable();
                $table->dateTime('rejected_at')->nullable();

                $table->foreignId('collected_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('received_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('rejected_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->text('rejection_reason')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['laboratory_order_id', 'status'], 'lab_spec_order_status_idx');
            });
        }

        if (!Schema::hasTable('laboratory_results')) {
            Schema::create('laboratory_results', function (Blueprint $table) {
                $table->id();

                $table->foreignId('laboratory_order_item_id')
                    ->constrained('laboratory_order_items')
                    ->cascadeOnDelete();

                $table->foreignId('parameter_id')
                    ->constrained('laboratory_parameters')
                    ->restrictOnDelete();

                $table->string('value', 255)->nullable();
                $table->decimal('numeric_value', 16, 4)->nullable();
                $table->string('unit', 40)->nullable();
                $table->decimal('reference_low', 16, 4)->nullable();
                $table->decimal('reference_high', 16, 4)->nullable();
                $table->string('reference_text', 255)->nullable();
                $table->enum('flag', [
                    'normal',
                    'low',
                    'high',
                    'critical',
                    'abnormal',
                ])->default('normal');
                $table->text('notes')->nullable();

                $table->foreignId('entered_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->dateTime('entered_at')->nullable();

                $table->foreignId('verified_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->dateTime('verified_at')->nullable();

                $table->timestamps();

                $table->unique(
                    ['laboratory_order_item_id', 'parameter_id'],
                    'lab_result_item_param_unique'
                );
                $table->index(['flag', 'verified_at'], 'lab_result_flag_verified_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('laboratory_results');
        Schema::dropIfExists('laboratory_specimens');
        Schema::dropIfExists('laboratory_order_items');
        Schema::dropIfExists('laboratory_orders');
        Schema::dropIfExists('laboratory_reference_ranges');
        Schema::dropIfExists('laboratory_parameters');
        Schema::dropIfExists('laboratory_test_types');
        Schema::dropIfExists('laboratory_sample_types');
    }
};
