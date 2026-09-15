<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryRequest extends Model
{
    protected $fillable = [
        'request_number',
        'unit_id',
        'warehouse_id',
        'status',
        'notes',
        'rejection_reason',
        'requested_by',
        'approved_by',
        'approved_at',
        'distributed_by',
        'distributed_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'distributed_at' => 'datetime',
        ];
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
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
            InventoryRequestItem::class,
            'inventory_request_id'
        );
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'requested_by'
        );
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'approved_by'
        );
    }

    public function distributedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'distributed_by'
        );
    }
}
