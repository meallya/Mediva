<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrAttendance extends Model
{
    protected $table = 'hr_attendances';
    protected $fillable = [
        'employee_id',
        'schedule_id',
        'attendance_date',
        'clock_in_at',
        'clock_out_at',
        'late_minutes',
        'early_leave_minutes',
        'status',
        'notes'
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(HrEmployeeSchedule::class, 'schedule_id');
    }
}
