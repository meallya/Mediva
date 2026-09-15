<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryRequestItem extends Model
{
    protected $fillable = [
        'inventory_request_id',
        'item_id',
        'requested_quantity',
        'approved_quantity',
        'distributed_quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'requested_quantity' => 'decimal:2',
            'approved_quantity' => 'decimal:2',
            'distributed_quantity' => 'decimal:2',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(
            InventoryRequest::class,
            'inventory_request_id'
        );
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(
            InventoryItem::class,
            'item_id'
        );
    }
}
