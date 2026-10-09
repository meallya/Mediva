<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrHoliday extends Model
{
    protected $table = 'hr_holidays';
    protected $fillable = [
        'holiday_date',
        'name',
        'is_national',
        'notes'
    ];
}
