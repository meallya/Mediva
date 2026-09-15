<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InpatientRoom extends Model
{
    protected $fillable = [
        'room_id',
        'ward_type',
        'room_class',
        'bed_capacity',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'bed_capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
