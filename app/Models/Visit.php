<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'visit_number',

        'patient_id',
        'unit_id',

        'visit_type',

        'doctor_id',
        'payment_method_id',

        'status',

        'started_at',
        'completed_at',
        'cancelled_at',

        'notes',

        'ihs_encounter_id',

        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | REGISTRATION
    |--------------------------------------------------------------------------
    */

    public function registration(): BelongsTo
    {
        return $this->belongsTo(
            Registration::class,
            'registration_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PATIENT
    |--------------------------------------------------------------------------
    */

    public function patient(): BelongsTo
    {
        return $this->belongsTo(
            Patient::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT
    |--------------------------------------------------------------------------
    */

    public function unit(): BelongsTo
    {
        return $this->belongsTo(
            Unit::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUEUES
    |--------------------------------------------------------------------------
    */

    public function queues(): HasMany
    {
        return $this->hasMany(
            Queue::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATED BY
    |--------------------------------------------------------------------------
    */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATED BY
    |--------------------------------------------------------------------------
    */

    public function updater(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'updated_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DOCTOR
    |--------------------------------------------------------------------------
    */

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(
            Doctor::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(
            PaymentMethod::class
        );
    }


    /*
    |--------------------------------------------------------------------------
    | EXAMINATION
    |--------------------------------------------------------------------------
    */

    public function examination(): HasOne
    {
        return $this->hasOne(
            Examination::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MEDICAL RECORD
    |--------------------------------------------------------------------------
    */

    public function medicalRecord(): HasOne
    {
        return $this->hasOne(
            MedicalRecord::class
        );
    }
    
    /*
    |--------------------------------------------------------------------------
    | PRESCRIPTION
    |--------------------------------------------------------------------------
    */

    public function prescription(): HasOne
    {
        return $this->hasOne(
            Prescription::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | INVOICE
    |--------------------------------------------------------------------------
    */

    public function invoice(): HasOne
    {
        return $this->hasOne(
            invoice::class
        );
    }
}