<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperatingRoomUsage extends Model
{
    protected $fillable = [
        'surgery_id',
        'usage_type',
        'medicine_id',
        'inventory_item_id',
        'asset_id',
        'item_name',
        'quantity',
        'unit',
        'unit_price',
        'billable',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'billable' => 'boolean',
    ];

    public function surgery(): BelongsTo
    {
        return $this->belongsTo(Surgery::class);
    }
}
