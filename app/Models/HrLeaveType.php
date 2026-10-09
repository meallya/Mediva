<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrLeaveType extends Model
{
    protected $table = 'hr_leave_types';
    protected $fillable = [
        'code',
        'name',
        'default_quota',
        'deduct_quota',
        'requires_attachment',
        'is_active'
    ];
}
