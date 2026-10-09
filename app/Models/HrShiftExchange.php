<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrShiftExchange extends Model
{
    protected $table = 'hr_shift_exchanges';
    protected $fillable = [
        'requester_employee_id',
        'target_employee_id',
        'requester_schedule_id',
        'target_schedule_id',
        'status',
        'reason',
        'approved_by',
        'approved_at'
    ];
}
