<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryStockOpname extends Model
{
    protected $fillable = [
        'opname_number',
        'warehouse_id',
        'status',
        'notes',
        'completed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(
            InventoryWarehouse::class,
            'warehouse_id'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            InventoryStockOpnameItem::class,
            'inventory_stock_opname_id'
        );
    }
}
