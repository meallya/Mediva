<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperatingRoom extends Model
{
    protected $fillable = [
        'code', 'name', 'hospital_room_id', 'status', 'notes', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    // public function hospitalRoom(): BelongsTo
    // {
    //     return $this->belongsTo(HospitalRoom::class, 'hospital_room_id');
    // }

    public function surgeries(): HasMany
    {
        return $this->hasMany(Surgery::class);
    }
}
