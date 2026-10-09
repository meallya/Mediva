<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeCertification extends Model
{
    protected $table = 'hr_employee_certifications';
    protected $fillable = [
        'employee_id',
        'name',
        'certificate_number',
        'issuer',
        'issued_at',
        'valid_until',
        'document_path',
        'status'
    ];
}
