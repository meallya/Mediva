<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrPosition extends Model
{
    protected $table = 'hr_positions';
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active'
    ];
}
