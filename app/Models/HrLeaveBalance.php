<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrLeaveBalance extends Model
{
    protected $table = 'hr_leave_balances';
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'year',
        'quota',
        'used',
        'remaining'
    ];
}
