<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LaboratoryOrder extends Model
{
    protected $fillable = [
        'lab_number',
        'visit_id',
        'patient_id',
        'doctor_id',
        'requesting_unit_id',
        'status',
        'clinical_notes',
        'ordered_at',
        'collected_at',
        'processing_started_at',
        'submitted_for_verification_at',
        'verified_at',
        'cancelled_at',
        'cancellation_reason',
        'created_by',
        'updated_by',
        'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'ordered_at' => 'datetime',
            'collected_at' => 'datetime',
            'processing_started_at' => 'datetime',
            'submitted_for_verification_at' => 'datetime',
            'verified_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function requestingUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'requesting_unit_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(LaboratoryOrderItem::class, 'laboratory_order_id');
    }

    public function specimens(): HasMany
    {
        return $this->hasMany(LaboratorySpecimen::class, 'laboratory_order_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
