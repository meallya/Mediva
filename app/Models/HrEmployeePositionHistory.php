<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeePositionHistory extends Model
{
    protected $table = 'hr_employee_position_histories';
    protected $fillable = [
        'employee_id',
        'position_id',
        'unit_id',
        'movement_type',
        'start_date',
        'end_date',
        'reference_number',
        'notes',
        'created_by'
    ];
}
