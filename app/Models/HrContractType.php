<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrContractType extends Model
{
    protected $table = 'hr_contract_types';
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active'
    ];
}
