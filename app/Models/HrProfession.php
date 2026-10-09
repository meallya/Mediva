<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrProfession extends Model
{
    protected $table = 'hr_professions';
    protected $fillable = [
        'code',
        'name',
        'is_health_worker',
        'requires_str',
        'requires_sip',
        'is_active'
    ];
}
