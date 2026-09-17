<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LaboratoryTestType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'category',
        'sample_type_id',
        'price',
        'turnaround_minutes',
        'description',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function sampleType(): BelongsTo
    {
        return $this->belongsTo(LaboratorySampleType::class, 'sample_type_id');
    }

    public function parameters(): HasMany
    {
        return $this->hasMany(LaboratoryParameter::class, 'test_type_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(LaboratoryOrderItem::class, 'test_type_id');
    }
}
