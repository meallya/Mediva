<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doctor extends Model
{
    protected $fillable = [
        'employee_id',
        'sip_number',
        'specialization',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class
        );
    }

    public function units(): BelongsToMany
    {
        return $this->belongsToMany(
            Unit::class,
            'doctor_unit'
        )->withTimestamps();
    }

    public function visits(): HasMany
    {
        return $this->hasMany(
            Visit::class
        );
    }

    public function examinations(): HasMany
    {
        return $this -> hasMany(
            Examination::class
        );
    }

    public function laboratoryOrders(): HasMany
    {
        return $this->hasMany(
            LaboratoryOrder::class
        );
    }

}