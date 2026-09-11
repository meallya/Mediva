<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Queue extends Model
{
    use HasFactory;

    protected $fillable = [
        'visit_id',
        'unit_id',

        'service_type',
        'queue_number',

        'priority',
        'status',

        'taken_at',
        'called_at',
        'started_at',
        'completed_at',

        'counter',
        'booking_code',
    ];

    protected function casts(): array
    {
        return [
            'taken_at' => 'datetime',
            'called_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | VISIT
    |--------------------------------------------------------------------------
    */

    public function visit(): BelongsTo
    {
        return $this->belongsTo(
            Visit::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT
    |--------------------------------------------------------------------------
    */

    public function unit(): BelongsTo
    {
        return $this->belongsTo(
            Unit::class
        );
    }
}