<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalRecordRevision extends Model
{
    protected $fillable = [
        'medical_record_id',
        'revision_number',
        'section',
        'reason',
        'note',
        'created_by',
    ];

    public function medicalRecord(): BelongsTo
    {
        return $this->belongsTo(
            MedicalRecord::class
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