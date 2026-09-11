<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    protected $fillable = [
        'stock_opname_id',
        'medicine_batch_id',
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
            StockOpname::class,
            'stock_opname_id'
        );
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(
            MedicineBatch::class,
            'medicine_batch_id'
        );
    }
}