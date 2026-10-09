<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEmploymentStatus extends Model
{
    protected $table = 'hr_employment_statuses';
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active'
    ];
}
