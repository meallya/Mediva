<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    protected $fillable = [
        'employee_number',
        'name',
        'email',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): HasOne
    {
        return $this->hasOne(
            User::class
        );
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(
            Doctor::class
        );
    }
}