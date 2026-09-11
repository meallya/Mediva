<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalRecord extends Model
{
    protected $fillable = [
        'record_number',
        'patient_id',
        'visit_id',
        'examination_id',
        'doctor_id',
        'unit_id',
        'clinical_snapshot',
        'coding_snapshot',
        'finalized_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'clinical_snapshot' =>
                'array',

            'coding_snapshot' =>
                'array',

            'finalized_at' =>
                'datetime',
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

    public function unit(): BelongsTo
    {
        return $this->belongsTo(
            Unit::class
        );
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(
            MedicalRecordRevision::class
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
}