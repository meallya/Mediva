<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrEducationLevel extends Model
{
    protected $table = 'hr_education_levels';
    protected $fillable = [
        'code',
        'name',
        'level_order',
        'is_active'
    ];
}
