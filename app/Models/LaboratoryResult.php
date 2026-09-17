<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaboratoryResult extends Model
{
    protected $fillable = [
        'laboratory_order_item_id',
        'parameter_id',
        'value',
        'numeric_value',
        'unit',
        'reference_low',
        'reference_high',
        'reference_text',
        'flag',
        'notes',
        'entered_by',
        'entered_at',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'numeric_value' => 'decimal:4',
            'reference_low' => 'decimal:4',
            'reference_high' => 'decimal:4',
            'entered_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(LaboratoryOrderItem::class, 'laboratory_order_item_id');
    }

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(LaboratoryParameter::class, 'parameter_id');
    }

    public function enterer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
