<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrPerformanceItem extends Model
{
    protected $table = 'hr_performance_items';

    protected $fillable = [
        'performance_review_id',
        'indicator',
        'weight',
        'target',
        'realization',
        'score',
        'notes',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(HrPerformanceReview::class, 'performance_review_id');
    }
}