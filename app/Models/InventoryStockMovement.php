<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryStockMovement extends Model
{
    protected $fillable = [
        'item_id',
        'warehouse_id',
        'movement_type',
        'quantity_change',
        'stock_before',
        'stock_after',
        'supplier_id',
        'destination_unit_id',
        'reference_type',
        'reference_id',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity_change' => 'decimal:2',
            'stock_before' => 'decimal:2',
            'stock_after' => 'decimal:2',
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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function destinationUnit(): BelongsTo
    {
        return $this->belongsTo(
            Unit::class,
            'destination_unit_id'
        );
    }
}
