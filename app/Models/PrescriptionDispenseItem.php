<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionDispenseItem extends Model
{
    protected $fillable = [
        'prescription_id',
        'prescription_item_id',
        'medicine_batch_id',
        'quantity',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(
            Prescription::class
        );
    }

    public function prescriptionItem(): BelongsTo
    {
        return $this->belongsTo(
            PrescriptionItem::class
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