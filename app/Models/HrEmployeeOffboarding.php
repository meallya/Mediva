<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeOffboarding extends Model
{
    protected $table = 'hr_employee_offboardings';
    protected $fillable = [
        'employee_id',
        'type',
        'effective_date',
        'reason',
        'employee_deactivated',
        'user_deactivated',
        'roles_revoked',
        'units_revoked',
        'processed_by',
        'processed_at'
    ];
}
