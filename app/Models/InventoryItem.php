<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'category_id',
        'uom_id',
        'default_supplier_id',
        'minimum_stock',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'minimum_stock' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            InventoryCategory::class,
            'category_id'
        );
    }

    public function uom(): BelongsTo
    {
        return $this->belongsTo(
            InventoryUom::class,
            'uom_id'
        );
    }

    public function defaultSupplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class,
            'default_supplier_id'
        );
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(
            InventoryStock::class,
            'item_id'
        );
    }
}
