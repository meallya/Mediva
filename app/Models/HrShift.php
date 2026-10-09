<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrShift extends Model
{
    protected $table = 'hr_shifts';
    protected $fillable = [
        'code',
        'name',
        'start_time',
        'end_time',
        'cross_day',
        'tolerance_minutes',
        'is_active'
    ];
}
