<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeCredential extends Model
{
    protected $table = 'hr_employee_credentials';
    protected $fillable = [
        'employee_id',
        'credential_type',
        'credential_number',
        'issued_at',
        'valid_until',
        'issuer',
        'document_path',
        'status',
        'verified_at',
        'verified_by',
        'notes'
    ];
}
