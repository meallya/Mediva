<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\HrEmployeeUnitAssignment;

class Employee extends Model
{
    protected $fillable = [
        'employee_number',
        'name',
        'email',
        'phone',
        'is_active',
        'nik',
        'birth_place',
        'birth_of_date',
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
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'date_of_birth' => 'date',
            'join_date' => 'date',
            'exit_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user(): HasOne
    {
        return $this->hasOne(
            User::class
        );
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(
            Doctor::class
        );
    }

    public function employment(): HasOne 
    { 
        return $this->hasOne(
            HrEmployeeEmployment::class
        ); 
    }

    public function unitAssignments(): HasMany 
    { 
        return $this->hasMany(HrEmployeeUnitAssignment::class, 'employee_id'); 
    }

    public function positionHistories(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeePositionHistory::class
        ); 
    }

    public function educations(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeeEducation::class
        ); 
    }

    public function certifications(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeeCertification::class
        ); 
    }

    public function credentials(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeeCredential::class
        ); 
    }

    public function contracts(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeeContract::class
        ); 
    }

    public function schedules(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeeSchedule::class
        ); 
    }

    public function attendances(): HasMany 
    { 
        return $this->hasMany(
            HrAttendance::class
        ); 
    }

    public function leaveBalance(): HasMany 
    { 
        return $this->hasMany(
            HrLeaveBalance::class
        ); 
    }

    public function absences(): HasMany 
    { 
        return $this->hasMany(
            HrAbsenceRequest::class
        ); 
    }

    public function overtimes(): HasMany 
    { 
        return $this->hasMany(
            HrOvertimeRequest::class
        ); 
    }

    public function performances(): HasMany 
    { 
        return $this->hasMany(
            HrPerformanceReview::class
        ); 
    }

    public function disciplinaryAction(): HasMany 
    { 
        return $this->hasMany(
            HrDisciplinaryAction::class
        ); 
    }    

    public function trainings(): HasMany 
    { 
        return $this->hasMany(
            HrTrainingParticipant::class
        ); 
    }

    public function documents(): HasMany 
    { 
        return $this->hasMany(
            HrEmployeeDocument::class
        ); 
    }

    public function offboarding(): HasOne 
    { 
        return $this->hasOne(
            HrEmployeeOffboarding::class
        ); 
    }

    public function directSupervisor(): BelongsTo 
    { 
        return $this->belongsTo(
            Employee::class, 
            'direct_supervisor_employee_id'
        ); 
    }
}