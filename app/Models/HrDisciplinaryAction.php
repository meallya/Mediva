<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrDisciplinaryAction extends Model
{
    protected $table = 'hr_disciplinary_actions';
    protected $fillable = [
        'employee_id',
        'violation_type',
        'incident_date',
        'description',
        'action_type',
        'reference_number',
        'document_path',
        'recorded_by'
    ];
}
