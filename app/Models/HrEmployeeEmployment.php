<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeEmployment extends Model
{
    protected $table = 'hr_employee_employments';
    protected $fillable = [
        'employee_id',
        'employment_status_id',
        'position_id',
        'profession_id',
        'grade_id',
        'primary_unit_id',
        'effective_date',
        'notes'
    ];
}
