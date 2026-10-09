<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeEducation extends Model
{
    protected $table = 'hr_employee_educations';
    protected $fillable = [
        'employee_id',
        'education_level_id',
        'institution',
        'study_program',
        'graduation_year',
        'certificate_number',
        'document_path',
        'is_latest'
    ];
}
