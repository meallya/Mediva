<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationType extends Model
{
    protected $table = 'operating_room_operation_types';

    protected $fillable = [
        'code', 'name', 'description', 'default_duration_minutes',
        'default_tariff', 'is_active',
    ];

    protected $casts = [
        'default_tariff' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function surgeries(): HasMany
    {
        return $this->hasMany(Surgery::class, 'operation_type_id');
    }
}
