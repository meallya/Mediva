<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrAbsenceRequest extends Model
{
    protected $table = 'hr_absence_requests';
    protected $fillable = [
        'employee_id',
        'request_type',
        'leave_type_id',
        'start_date',
        'end_date',
        'total_days',
        'reason',
        'attachment_path',
        'status',
        'supervisor_approved_by',
        'supervisor_approved_at',
        'hr_approved_by',
        'hr_approved_at',
        'approval_notes',
        // 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'supervisor_approved_at' => 'datetime',
        'hr_approved_at' => 'datetime',
    ];

    /**
     * Get the employee associated with the absence request.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    /**
     * Get the supervisor who approved this request.
     */
    public function supervisorApproval(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_approved_by');
    }

    /**
     * Get the HR who approved this request.
     */
    public function hrApproval(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_approved_by');
    }

    /**
     * Get the user who created this request.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if request is pending approval
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if request is fully approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved_hr';
    }

    /**
     * Check if request is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}