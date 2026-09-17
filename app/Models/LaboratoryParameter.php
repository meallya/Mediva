<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LaboratoryParameter extends Model
{
    protected $fillable = [
        'test_type_id',
        'code',
        'name',
        'data_type',
        'unit',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function testType(): BelongsTo
    {
        return $this->belongsTo(LaboratoryTestType::class, 'test_type_id');
    }

    public function referenceRanges(): HasMany
    {
        return $this->hasMany(LaboratoryReferenceRange::class, 'parameter_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(LaboratoryResult::class, 'parameter_id');
    }
}
