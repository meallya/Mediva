<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LaboratorySampleType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'container',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function testTypes(): HasMany
    {
        return $this->hasMany(LaboratoryTestType::class, 'sample_type_id');
    }

    public function specimens(): HasMany
    {
        return $this->hasMany(LaboratorySpecimen::class, 'sample_type_id');
    }
}
