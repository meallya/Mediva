<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExaminationDiagnosis extends Model
{
    protected $fillable = [
        'examination_id',
        'icd10_code_id',
        'type',
        'notes',
        'created_by',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(
            Examination::class
        );
    }

    public function code(): BelongsTo
    {
        return $this->belongsTo(
            Icd10Code::class,
            'icd10_code_id'
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }
}