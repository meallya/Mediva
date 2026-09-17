<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaboratoryReferenceRange extends Model
{
    protected $fillable = [
        'parameter_id',
        'gender',
        'age_min_months',
        'age_max_months',
        'min_value',
        'max_value',
        'reference_text',
        'critical_min',
        'critical_max',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_value' => 'decimal:4',
            'max_value' => 'decimal:4',
            'critical_min' => 'decimal:4',
            'critical_max' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(LaboratoryParameter::class, 'parameter_id');
    }
}
