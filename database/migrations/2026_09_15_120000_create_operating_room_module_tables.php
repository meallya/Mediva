<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operating_room_operation_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->unsignedInteger('default_duration_minutes')->nullable();
            $table->decimal('default_tariff', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('operating_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 120);
            // External MEDIVA relation. Indexed only to avoid migration break if current table name differs.
            $table->unsignedBigInteger('hospital_room_id')->nullable()->index();
            $table->enum('status', ['available', 'maintenance', 'inactive'])->default('available');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('surgeries', function (Blueprint $table) {
            $table->id();
            $table->string('surgery_number', 40)->unique();

            // External MEDIVA relations.
            $table->unsignedBigInteger('patient_id')->index();
            $table->unsignedBigInteger('visit_id')->index();
            $table->unsignedBigInteger('requesting_doctor_id')->nullable()->index();
            $table->unsignedBigInteger('operator_doctor_id')->nullable()->index();
            $table->unsignedBigInteger('anesthesiologist_doctor_id')->nullable()->index();

            $table->foreignId('operation_type_id')
                ->nullable()
                ->constrained('operating_room_operation_types')
                ->nullOnDelete();

            $table->foreignId('operating_room_id')
                ->nullable()
                ->constrained('operating_rooms')
                ->nullOnDelete();

            $table->enum('priority', ['elective', 'urgent', 'emergency'])->default('elective');
            $table->enum('status', [
                'requested', 'scheduled', 'preop', 'ready',
                'in_progress', 'recovery', 'completed', 'cancelled'
            ])->default('requested')->index();

            $table->text('preoperative_diagnosis')->nullable();
            $table->text('planned_procedure')->nullable();

            $table->dateTime('scheduled_start_at')->nullable()->index();
            $table->dateTime('scheduled_end_at')->nullable()->index();
            $table->unsignedInteger('duration_minutes')->nullable();

            $table->boolean('consent_obtained')->default(false);
            $table->dateTime('consent_obtained_at')->nullable();
            $table->unsignedBigInteger('consent_recorded_by')->nullable()->index();

            $table->enum('fasting_status', [
                'not_required', 'not_started', 'in_progress', 'adequate', 'not_adequate'
            ])->default('not_started');

            $table->text('supporting_examinations')->nullable();
            $table->text('patient_preparation')->nullable();

            $table->dateTime('started_at')->nullable();
            $table->dateTime('ended_at')->nullable();

            $table->text('postoperative_diagnosis')->nullable();
            $table->text('performed_procedure')->nullable();
            $table->longText('operation_notes')->nullable();
            $table->text('complications')->nullable();
            $table->unsignedInteger('blood_loss_ml')->nullable();
            $table->longText('postoperative_instructions')->nullable();

            $table->enum('postoperative_patient_status', [
                'stable', 'observation', 'ward', 'icu', 'hcu', 'referred', 'deceased'
            ])->nullable();

            $table->text('cancel_reason')->nullable();
            $table->dateTime('cancelled_at')->nullable();

            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->index(['operating_room_id', 'scheduled_start_at', 'scheduled_end_at'], 'or_schedule_idx');
            $table->index(['visit_id', 'status'], 'or_visit_status_idx');
        });

        Schema::create('surgery_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surgery_id')->constrained('surgeries')->cascadeOnDelete();
            $table->unsignedBigInteger('employee_id')->nullable()->index();
            $table->unsignedBigInteger('doctor_id')->nullable()->index();
            $table->enum('role', [
                'operator', 'anesthesiologist', 'assistant',
                'instrument_nurse', 'circulating_nurse', 'other'
            ])->index();
            $table->string('display_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['surgery_id', 'role']);
        });

        Schema::create('surgery_safety_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surgery_id')->unique()->constrained('surgeries')->cascadeOnDelete();

            $table->json('preoperative_checklist')->nullable();
            $table->dateTime('preoperative_completed_at')->nullable();
            $table->unsignedBigInteger('preoperative_completed_by')->nullable()->index();

            $table->json('sign_in')->nullable();
            $table->dateTime('sign_in_completed_at')->nullable();
            $table->unsignedBigInteger('sign_in_completed_by')->nullable()->index();

            $table->json('time_out')->nullable();
            $table->dateTime('time_out_completed_at')->nullable();
            $table->unsignedBigInteger('time_out_completed_by')->nullable()->index();

            $table->json('sign_out')->nullable();
            $table->dateTime('sign_out_completed_at')->nullable();
            $table->unsignedBigInteger('sign_out_completed_by')->nullable()->index();

            $table->timestamps();
        });

        Schema::create('operating_room_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surgery_id')->constrained('surgeries')->cascadeOnDelete();
            $table->enum('usage_type', ['medicine', 'medical_material', 'asset'])->index();

            // External MEDIVA relations.
            $table->unsignedBigInteger('medicine_id')->nullable()->index();
            $table->unsignedBigInteger('inventory_item_id')->nullable()->index();
            $table->unsignedBigInteger('asset_id')->nullable()->index();

            $table->string('item_name');
            $table->decimal('quantity', 12, 3)->default(1);
            $table->string('unit', 30)->nullable();
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->boolean('billable')->default(true);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('recorded_by')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('surgery_recoveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surgery_id')->unique()->constrained('surgeries')->cascadeOnDelete();
            $table->unsignedBigInteger('hospital_room_id')->nullable()->index();

            $table->dateTime('recovery_started_at')->nullable();
            $table->dateTime('recovery_ended_at')->nullable();

            $table->string('consciousness')->nullable();
            $table->json('vital_signs')->nullable();
            $table->unsignedTinyInteger('pain_score')->nullable();
            $table->boolean('nausea_vomiting')->default(false);
            $table->unsignedTinyInteger('aldrete_score')->nullable();

            $table->enum('status', [
                'waiting', 'observing', 'ready_transfer', 'transferred', 'escalated'
            ])->default('waiting');

            $table->text('notes')->nullable();
            $table->unsignedBigInteger('recorded_by')->nullable()->index();
            $table->timestamps();
        });

        // Append-only clinical history for the Operating Room record itself.
        Schema::create('surgery_clinical_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surgery_id')->constrained('surgeries')->cascadeOnDelete();
            $table->string('event', 80)->index();
            $table->json('snapshot')->nullable();
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('active_role')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surgery_clinical_histories');
        Schema::dropIfExists('surgery_recoveries');
        Schema::dropIfExists('operating_room_usages');
        Schema::dropIfExists('surgery_safety_checklists');
        Schema::dropIfExists('surgery_team_members');
        Schema::dropIfExists('surgeries');
        Schema::dropIfExists('operating_rooms');
        Schema::dropIfExists('operating_room_operation_types');
    }
};
