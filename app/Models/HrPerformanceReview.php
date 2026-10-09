<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HrPerformanceReview extends Model
{
    protected $table = 'hr_performance_reviews';

    protected $fillable = [
        'employee_id',
        'period_name',
        'period_start',
        'period_end',
        'final_score',
        'supervisor_notes',
        'evaluation',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(HrPerformanceItem::class, 'performance_review_id');
    }
}