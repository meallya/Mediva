<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmployeeDocument extends Model
{
    protected $table = 'hr_employee_documents';
    protected $fillable = [
        'employee_id',
        'document_type',
        'document_number',
        'name',
        'issued_at',
        'valid_until',
        'file_path',
        'is_verified',
        'verified_by',
        'verified_at'
    ];
}
