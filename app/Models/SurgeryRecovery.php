<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurgeryRecovery extends Model
{
    protected $fillable = [
        'surgery_id',
        'hospital_room_id',
        'recovery_started_at',
        'recovery_ended_at',
        'consciousness',
        'vital_signs',
        'pain_score',
        'nausea_vomiting',
        'aldrete_score',
        'status',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'recovery_started_at' => 'datetime',
        'recovery_ended_at' => 'datetime',
        'vital_signs' => 'array',
        'pain_score' => 'integer',
        'nausea_vomiting' => 'boolean',
        'aldrete_score' => 'integer',
    ];

    public function surgery(): BelongsTo
    {
        return $this->belongsTo(Surgery::class);
    }

    // public function hospitalRoom(): BelongsTo
    // {
    //     return $this->belongsTo(HospitalRoom::class, 'hospital_room_id');
    // }
}
