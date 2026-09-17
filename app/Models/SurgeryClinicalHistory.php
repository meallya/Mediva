<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurgeryClinicalHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'surgery_id',
        'event',
        'snapshot',
        'actor_id',
        'active_role',
        'created_at',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'created_at' => 'datetime',
    ];

    public function surgery(): BelongsTo
    {
        return $this->belongsTo(Surgery::class);
    }
}
