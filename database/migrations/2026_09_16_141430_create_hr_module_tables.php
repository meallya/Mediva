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
        | EXTEND EMPLOYEES
        |--------------------------------------------------------------------------
        */

        Schema::table('employees', function (Blueprint $table) {
            $table->string('nik', 32)
                ->nullable()
                ->unique()
                ->after('employee_number');

            $table->string('birth_place')
                ->nullable();

            $table->date('date_of_birth')
                ->nullable();

            $table->string('gender', 20)
                ->nullable();

            $table->text('address')
                ->nullable();

            $table->string('marital_status', 30)
                ->nullable();

            $table->string('emergency_contact_name')
                ->nullable();

            $table->string('emergency_contact_phone', 50)
                ->nullable();

            $table->string('photo_path')
                ->nullable();

            $table->date('join_date')
                ->nullable();

            $table->date('exit_date')
                ->nullable();

            $table->unsignedBigInteger('direct_supervisor_employee_id')
                ->nullable();

            $table->foreign('direct_supervisor_employee_id')
                ->references('id')
                ->on('employees')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });


        /*
        |--------------------------------------------------------------------------
        | EMPLOYMENT STATUS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employment_statuses', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->text('description')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | POSITIONS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_positions', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->text('description')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | PROFESSIONS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_professions', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->boolean('is_health_worker')
                ->default(false);

            $table->boolean('requires_str')
                ->default(false);

            $table->boolean('requires_sip')
                ->default(false);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | GRADES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_grades', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->text('description')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | EDUCATION LEVELS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_education_levels', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->unsignedInteger('level_order')
                ->default(0);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | CONTRACT TYPES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_contract_types', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->text('description')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | LEAVE TYPES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_leave_types', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->unsignedInteger('default_quota')
                ->default(0);

            $table->boolean('deduct_quota')
                ->default(true);

            $table->boolean('requires_attachment')
                ->default(false);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | SHIFTS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_shifts', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->unique();

            $table->string('name');

            $table->time('start_time')
                ->nullable();

            $table->time('end_time')
                ->nullable();

            $table->boolean('cross_day')
                ->default(false);

            $table->unsignedInteger('tolerance_minutes')
                ->default(0);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | HOLIDAYS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_holidays', function (Blueprint $table) {
            $table->id();

            $table->date('holiday_date');

            $table->string('name');

            $table->boolean('is_national')
                ->default(false);

            $table->text('notes')
                ->nullable();

            $table->unique([
                'holiday_date',
                'name',
            ]);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | EMPLOYEE EMPLOYMENT
        |--------------------------------------------------------------------------
        |
        | Current employment data.
        |
        */

        Schema::create('hr_employee_employments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->unique()
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('employment_status_id')
                ->nullable()
                ->constrained('hr_employment_statuses')
                ->nullOnDelete();

            $table->foreignId('position_id')
                ->nullable()
                ->constrained('hr_positions')
                ->nullOnDelete();

            $table->foreignId('profession_id')
                ->nullable()
                ->constrained('hr_professions')
                ->nullOnDelete();

            $table->foreignId('grade_id')
                ->nullable()
                ->constrained('hr_grades')
                ->nullOnDelete();

            $table->foreignId('primary_unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table->date('effective_date')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | EMPLOYEE UNIT ASSIGNMENTS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_unit_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->boolean('is_primary')
                ->default(false);

            $table->date('start_date')
                ->nullable();

            $table->date('end_date')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index([
                'employee_id',
                'unit_id',
                'is_active',
            ]);
        });


        /*
        |--------------------------------------------------------------------------
        | POSITION HISTORY
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_position_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('position_id')
                ->nullable()
                ->constrained('hr_positions')
                ->nullOnDelete();

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table->string('movement_type')
                ->nullable();

            /*
             * appointment
             * promotion
             * demotion
             * rotation
             * mutation
             */

            $table->date('start_date');

            $table->date('end_date')
                ->nullable();

            $table->string('reference_number')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | EDUCATION RECORDS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_educations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('education_level_id')
                ->nullable()
                ->constrained('hr_education_levels')
                ->nullOnDelete();

            $table->string('institution');

            $table->string('study_program')
                ->nullable();

            $table->unsignedInteger('graduation_year')
                ->nullable();

            $table->string('certificate_number')
                ->nullable();

            $table->string('document_path')
                ->nullable();

            $table->boolean('is_latest')
                ->default(false);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | CERTIFICATIONS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_certifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('certificate_number')
                ->nullable();

            $table->string('issuer')
                ->nullable();

            $table->date('issued_at')
                ->nullable();

            $table->date('valid_until')
                ->nullable();

            $table->string('document_path')
                ->nullable();

            $table->string('status')
                ->default('active');

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | HEALTH WORKER CREDENTIALS — STR / SIP
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_credentials', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('credential_type');

            /*
             * STR
             * SIP
             * OTHER
             */

            $table->string('credential_number');

            $table->date('issued_at')
                ->nullable();

            $table->date('valid_until')
                ->nullable();

            $table->string('issuer')
                ->nullable();

            $table->string('document_path')
                ->nullable();

            $table->string('status')
                ->default('active');

            $table->timestamp('verified_at')
                ->nullable();

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'credential_type',
                'credential_number',
            ]);
        });


        /*
        |--------------------------------------------------------------------------
        | EMPLOYEE CONTRACTS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_contracts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('contract_type_id')
                ->nullable()
                ->constrained('hr_contract_types')
                ->nullOnDelete();

            $table->string('contract_number')
                ->nullable()
                ->unique();

            $table->date('start_date');

            $table->date('end_date')
                ->nullable();

            $table->string('status')
                ->default('active');

            $table->string('document_path')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | EMPLOYEE SCHEDULES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table->foreignId('shift_id')
                ->nullable()
                ->constrained('hr_shifts')
                ->nullOnDelete();

            $table->date('schedule_date');

            $table->string('schedule_type')
                ->default('work');

            /*
             * work
             * off
             * leave
             * holiday
             */

            $table->text('notes')
                ->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique(
                [
                    'employee_id',
                    'schedule_date',
                ],
                'hr_emp_schedule_unique'
            );
        });


        /*
        |--------------------------------------------------------------------------
        | SHIFT EXCHANGES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_shift_exchanges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('requester_employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('target_employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('requester_schedule_id')
                ->nullable()
                ->constrained('hr_employee_schedules')
                ->nullOnDelete();

            $table->foreignId('target_schedule_id')
                ->nullable()
                ->constrained('hr_employee_schedules')
                ->nullOnDelete();

            $table->string('status')
                ->default('pending');

            $table->text('reason')
                ->nullable();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | ATTENDANCES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('schedule_id')
                ->nullable()
                ->constrained('hr_employee_schedules')
                ->nullOnDelete();

            $table->date('attendance_date');

            $table->datetime('clock_in_at')
                ->nullable();

            $table->datetime('clock_out_at')
                ->nullable();

            $table->integer('late_minutes')
                ->default(0);

            $table->integer('early_leave_minutes')
                ->default(0);

            $table->string('status')
                ->default('present');

            /*
             * present
             * late
             * absent
             * permission
             * sick
             * leave
             */

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'employee_id',
                'attendance_date',
            ]);
        });


        /*
        |--------------------------------------------------------------------------
        | LEAVE BALANCES
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_leave_balances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignId('leave_type_id')
                ->constrained('hr_leave_types')
                ->cascadeOnDelete();

            $table->unsignedInteger('year');

            $table->decimal('quota', 8, 2)
                ->default(0);

            $table->decimal('used', 8, 2)
                ->default(0);

            $table->decimal('remaining', 8, 2)
                ->default(0);

            $table->timestamps();

            $table->unique([
                'employee_id',
                'leave_type_id',
                'year',
            ]);
        });


        /*
        |--------------------------------------------------------------------------
        | ABSENCE / LEAVE / SICK REQUESTS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_absence_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('request_type');

            /*
             * leave
             * permission
             * sick
             */

            $table->foreignId('leave_type_id')
                ->nullable()
                ->constrained('hr_leave_types')
                ->nullOnDelete();

            $table->date('start_date');

            $table->date('end_date');

            $table->decimal('total_days', 8, 2)
                ->default(1);

            $table->text('reason')
                ->nullable();

            $table->string('attachment_path')
                ->nullable();

            $table->string('status')
                ->default('pending_supervisor');

            /*
             * draft
             * pending_supervisor
             * pending_hr
             * approved
             * rejected
             * cancelled
             */

            $table->foreignId('supervisor_approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('supervisor_approved_at')
                ->nullable();

            $table->foreignId('hr_approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('hr_approved_at')
                ->nullable();

            $table->text('approval_notes')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | OVERTIME REQUESTS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_overtime_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->date('overtime_date');

            $table->time('start_time');

            $table->time('end_time');

            $table->unsignedInteger('duration_minutes')
                ->default(0);

            $table->text('reason')
                ->nullable();

            $table->string('status')
                ->default('pending_supervisor');

            $table->foreignId('supervisor_approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('supervisor_approved_at')
                ->nullable();

            $table->foreignId('hr_approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('hr_approved_at')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | PERFORMANCE REVIEWS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_performance_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('period_name');

            $table->date('period_start');

            $table->date('period_end');

            $table->decimal('final_score', 8, 2)
                ->nullable();

            $table->text('supervisor_notes')
                ->nullable();

            $table->text('evaluation')
                ->nullable();

            $table->string('status')
                ->default('draft');

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | KPI ITEMS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_performance_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('performance_review_id')
                ->constrained('hr_performance_reviews')
                ->cascadeOnDelete();

            $table->string('indicator');

            $table->decimal('weight', 8, 2)
                ->default(0);

            $table->decimal('target', 12, 2)
                ->nullable();

            $table->decimal('realization', 12, 2)
                ->nullable();

            $table->decimal('score', 8, 2)
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | DISCIPLINARY ACTIONS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_disciplinary_actions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('violation_type');

            $table->date('incident_date');

            $table->text('description');

            $table->string('action_type')
                ->nullable();

            /*
             * verbal_warning
             * written_warning
             * sp1
             * sp2
             * sp3
             */

            $table->string('reference_number')
                ->nullable();

            $table->string('document_path')
                ->nullable();

            $table->foreignId('recorded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | TRAININGS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_trainings', function (Blueprint $table) {
            $table->id();

            $table->string('code')
                ->nullable()
                ->unique();

            $table->string('name');

            $table->string('organizer')
                ->nullable();

            $table->date('start_date')
                ->nullable();

            $table->date('end_date')
                ->nullable();

            $table->string('location')
                ->nullable();

            $table->text('description')
                ->nullable();

            $table->timestamps();
        });


        Schema::create('hr_training_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('training_id')
                ->constrained('hr_trainings')
                ->cascadeOnDelete();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('status')
                ->default('registered');

            $table->string('certificate_number')
                ->nullable();

            $table->string('certificate_path')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'training_id',
                'employee_id',
            ]);
        });


        /*
        |--------------------------------------------------------------------------
        | EMPLOYEE DOCUMENTS
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('document_type');

            /*
             * KTP
             * KK
             * NPWP
             * BPJS_HEALTH
             * BPJS_EMPLOYMENT
             * BANK
             * DIPLOMA
             * CERTIFICATE
             * STR
             * SIP
             * CONTRACT
             * OTHER
             */

            $table->string('document_number')
                ->nullable();

            $table->string('name')
                ->nullable();

            $table->date('issued_at')
                ->nullable();

            $table->date('valid_until')
                ->nullable();

            $table->string('file_path');

            $table->boolean('is_verified')
                ->default(false);

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('verified_at')
                ->nullable();

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | OFFBOARDING
        |--------------------------------------------------------------------------
        */

        Schema::create('hr_employee_offboardings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->unique()
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('type');

            /*
             * resign
             * termination
             * retirement
             * end_contract
             * other
             */

            $table->date('effective_date');

            $table->text('reason')
                ->nullable();

            $table->boolean('employee_deactivated')
                ->default(false);

            $table->boolean('user_deactivated')
                ->default(false);

            $table->boolean('roles_revoked')
                ->default(false);

            $table->boolean('units_revoked')
                ->default(false);

            $table->foreignId('processed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('processed_at')
                ->nullable();

            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('hr_employee_offboardings');

        Schema::dropIfExists('hr_employee_documents');

        Schema::dropIfExists('hr_training_participants');

        Schema::dropIfExists('hr_trainings');

        Schema::dropIfExists('hr_disciplinary_actions');

        Schema::dropIfExists('hr_performance_items');

        Schema::dropIfExists('hr_performance_reviews');

        Schema::dropIfExists('hr_overtime_requests');

        Schema::dropIfExists('hr_absence_requests');

        Schema::dropIfExists('hr_leave_balances');

        Schema::dropIfExists('hr_attendances');

        Schema::dropIfExists('hr_shift_exchanges');

        Schema::dropIfExists('hr_employee_schedules');

        Schema::dropIfExists('hr_employee_contracts');

        Schema::dropIfExists('hr_employee_credentials');

        Schema::dropIfExists('hr_employee_certifications');

        Schema::dropIfExists('hr_employee_educations');

        Schema::dropIfExists('hr_employee_position_histories');

        Schema::dropIfExists('hr_employee_unit_assignments');

        Schema::dropIfExists('hr_employee_employments');

        Schema::dropIfExists('hr_holidays');

        Schema::dropIfExists('hr_shifts');

        Schema::dropIfExists('hr_leave_types');

        Schema::dropIfExists('hr_contract_types');

        Schema::dropIfExists('hr_education_levels');

        Schema::dropIfExists('hr_grades');

        Schema::dropIfExists('hr_professions');

        Schema::dropIfExists('hr_positions');

        Schema::dropIfExists('hr_employment_statuses');

        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign([
                'direct_supervisor_employee_id',
            ]);

            $table->dropForeign([
                'created_by',
            ]);

            $table->dropForeign([
                'updated_by',
            ]);

            $table->dropColumn([
                'nik',
                'birth_place',
                'date_of_birth',
                'gender',
                'address',
                'marital_status',
                'emergency_contact_name',
                'emergency_contact_phone',
                'photo_path',
                'join_date',
                'exit_date',
                'direct_supervisor_employee_id',
                'created_by',
                'updated_by',
            ]);
        });
    }
};