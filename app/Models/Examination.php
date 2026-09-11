<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Examination extends Model
{
    protected $fillable = [
        'visit_id',
        'doctor_id',

        'subjective',
        'objective',
        'assessment',
        'plan',

        'systolic',
        'diastolic',
        'heart_rate',
        'respiratory_rate',
        'temperature',
        'weight',
        'height',

        'physical_examination',
        'doctor_notes',

        'status',
        'completed_at',

        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:1',
            'weight' => 'decimal:2',
            'height' => 'decimal:2',
            'completed_at' => 'datetime',
        ];
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(
            Visit::class
        );
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(
            Doctor::class
        );
    }

    public function diagnoses(): HasMany
    {
        return $this->hasMany(
            ExaminationDiagnosis::class
        );
    }

    public function procedures(): HasMany
    {
        return $this->hasMany(
            ExaminationProcedure::class
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

    public function medicalRecord(): HasOne
    {
        return $this->hasOne(
            MedicalRecord::class
        );
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(
            Prescription::class
        );
    }
}