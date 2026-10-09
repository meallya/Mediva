<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrGrade extends Model
{
    protected $table = 'hr_grades';
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active'
    ];
}
