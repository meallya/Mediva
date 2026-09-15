<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryStockOpnameItem extends Model
{
    protected $fillable = [
        'inventory_stock_opname_id',
        'item_id',
        'system_stock',
        'physical_stock',
        'difference',
    ];

    protected function casts(): array
    {
        return [
            'system_stock' => 'decimal:2',
            'physical_stock' => 'decimal:2',
            'difference' => 'decimal:2',
        ];
    }

    public function opname(): BelongsTo
    {
        return $this->belongsTo(
            InventoryStockOpname::class,
            'inventory_stock_opname_id'
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
