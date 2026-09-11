<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionItem extends Model
{
    protected $fillable = [
        'prescription_id',
        'medicine_id',
        'dosage',
        'frequency',
        'quantity',
        'unit',
        'instruction',
        'original_medicine_id',
        'substitution_reason',
        'substituted_by',
        'substituted_at',       
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'substituted_at' => 'datetime',
        ];
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(
            Prescription::class
        );
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(
            Medicine::class
        );
    }

    public function originalMedicine(): BelongsTo
    {
        return $this->belongsTo(
            Medicine::class,
            'original_medicine_id'
        );
    }
}