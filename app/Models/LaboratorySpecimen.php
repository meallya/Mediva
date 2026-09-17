<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaboratorySpecimen extends Model
{
    protected $fillable = [
        'specimen_number',
        'laboratory_order_id',
        'laboratory_order_item_id',
        'sample_type_id',
        'status',
        'collected_at',
        'received_at',
        'rejected_at',
        'collected_by',
        'received_by',
        'rejected_by',
        'rejection_reason',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'collected_at' => 'datetime',
            'received_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(LaboratoryOrder::class, 'laboratory_order_id');
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(LaboratoryOrderItem::class, 'laboratory_order_item_id');
    }

    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(LaboratorySampleType::class, 'sample_type_id');
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
