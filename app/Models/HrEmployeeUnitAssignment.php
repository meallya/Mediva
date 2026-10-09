<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeUnitAssignment extends Model
{
    protected $table = 'hr_employee_unit_assignments';
    protected $fillable = [
        'employee_id',
        'unit_id',
        'is_primary',
        'start_date',
        'end_date',
        'is_active'
    ];
}
