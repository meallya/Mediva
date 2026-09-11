<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicineBatch extends Model
{
    protected $fillable = [
        'medicine_id',
        'supplier_id',
        'batch_number',
        'expired_at',
        'stock',
        'purchase_price',
        'selling_price',
        'received_at',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'expired_at' => 'date:Y-m-d',
            'received_at' => 'date:Y-m-d',
            'stock' => 'decimal:2',
            'purchase_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(
            Medicine::class
        );
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class
        );
    }

    public function movements(): HasMany
    {
        return $this->hasMany(
            StockMovement::class,
            'medicine_batch_id'
        );
    }
}