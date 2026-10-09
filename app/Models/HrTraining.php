<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrTraining extends Model
{
    protected $table = 'hr_trainings';
    protected $fillable = [
        'code',
        'name',
        'organizer',
        'start_date',
        'end_date',
        'location',
        'description'
    ];
}
