<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryStock extends Model
{
    protected $fillable = [
        'item_id',
        'warehouse_id',
        'quantity',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(
            InventoryItem::class,
            'item_id'
        );
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(
            InventoryWarehouse::class,
            'warehouse_id'
        );
    }
}
