<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrOvertimeRequest extends Model
{
    protected $table = 'hr_overtime_requests';

    protected $fillable = [
        'employee_id',
        'overtime_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'reason',
        'status',
        'supervisor_approved_by',
        'supervisor_approved_at',
        'hr_approved_by',
        'hr_approved_at',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}