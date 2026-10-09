<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrEmployeeSchedule extends Model
{
    protected $table = 'hr_employee_schedules';
    protected $fillable = [
        'employee_id',
        'unit_id',
        'shift_id',
        'schedule_date',
        'schedule_type',
        'notes',
        'created_by',
        // 'updated_by',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}