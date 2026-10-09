<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeContract extends Model
{
    protected $table = 'hr_employee_contracts';
    protected $fillable = [
        'employee_id',
        'contract_type_id',
        'contract_number',
        'start_date',
        'end_date',
        'status',
        'document_path',
        'notes'
    ];
}
