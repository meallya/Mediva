<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'medical_record_number',
        'nik',
        'name',
        'gender',
        'date_of_birth',
        'address',
        'phone',
        'blood_type',
        'emergency_contact',
        'ihs_number',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'is_active' => 'boolean',
        ];
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

    public function registrations(): HasMany
    {
        return $this->hasMany(
            Registration::class
        );
    }

    public function medicalRecords(): HasMany
    {
        return $this->hasMany(
            MedicalRecord::class
        );
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(
            Invoice::class
        );
    }

    public function laboratoryOrders(): HasMany
    {
        return $this->hasMany(
            LaboratoryOrder::class
        );
    }

}