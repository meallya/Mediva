<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medicine extends Model
{
    protected $fillable = [
        'code',
        'name',
        'generic_name',
        'dosage_form',
        'strength',
        'unit',
        'manufacturer',
        'minimum_stock',

        /*
        |--------------------------------------------------------------------------
        | HALAL INFORMATION
        |--------------------------------------------------------------------------
        */

        'halal_status',
        'halal_certificate_number',
        'halal_valid_until',
        'halal_notes',

        /*
        |--------------------------------------------------------------------------
        | STATUS & AUDIT
        |--------------------------------------------------------------------------
        */

        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' =>
                'boolean',

            'halal_valid_until' =>
                'date:Y-m-d',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PRESCRIPTION ITEMS
    |--------------------------------------------------------------------------
    */

    public function prescriptionItems(): HasMany
    {
        return $this->hasMany(
            PrescriptionItem::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATOR
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
    | UPDATER
    |--------------------------------------------------------------------------
    */

    public function updater(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'updated_by'
        );
    }

    // Halal Medicine Function

    public function batches(): HasMany
    {
        return $this->hasMany(
            MedicineBatch::class
        );
    }
}