<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LaboratoryOrderItem extends Model
{
    protected $fillable = [
        'laboratory_order_id',
        'test_type_id',
        'status',
        'price',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(LaboratoryOrder::class, 'laboratory_order_id');
    }

    public function testType(): BelongsTo
    {
        return $this->belongsTo(LaboratoryTestType::class, 'test_type_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(LaboratoryResult::class, 'laboratory_order_item_id');
    }

    public function specimens(): HasMany
    {
        return $this->hasMany(LaboratorySpecimen::class, 'laboratory_order_item_id');
    }
}
