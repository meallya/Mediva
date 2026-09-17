<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurgerySafetyChecklist extends Model
{
    protected $fillable = [
        'surgery_id',
        'preoperative_checklist',
        'preoperative_completed_at',
        'preoperative_completed_by',
        'sign_in',
        'sign_in_completed_at',
        'sign_in_completed_by',
        'time_out',
        'time_out_completed_at',
        'time_out_completed_by',
        'sign_out',
        'sign_out_completed_at',
        'sign_out_completed_by',
    ];

    protected $casts = [
        'preoperative_checklist' => 'array',
        'preoperative_completed_at' => 'datetime',
        'sign_in' => 'array',
        'sign_in_completed_at' => 'datetime',
        'time_out' => 'array',
        'time_out_completed_at' => 'datetime',
        'sign_out' => 'array',
        'sign_out_completed_at' => 'datetime',
    ];

    public function surgery(): BelongsTo
    {
        return $this->belongsTo(Surgery::class);
    }
}
