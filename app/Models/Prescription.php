<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    protected $fillable = [
        'prescription_number',
        'patient_id',
        'visit_id',
        'examination_id',
        'doctor_id',
        'status',
        'doctor_notes',
        'submitted_at',
        'dispensed_at',
        'cancelled_at',
        'created_by',
        'updated_by',
        'verified_at',
        'verified_by',
        'verification_notes',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'dispensed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(
            Patient::class
        );
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(
            Visit::class
        );
    }

    public function examination(): BelongsTo
    {
        return $this->belongsTo(
            Examination::class
        );
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(
            Doctor::class
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            PrescriptionItem::class
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'updated_by'
        );
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'verified_by'
        );
    }

    public function dispenseItems(): HasMany
    {
        return $this->hasMany(
            PrescriptionDispenseItem::class
        );
    }       
}