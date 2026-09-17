<?php

namespace App\Models;

use App\Enums\FastingStatus;
use App\Enums\SurgeryPriority;
use App\Enums\SurgeryStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Surgery extends Model
{
    protected $fillable = [
        'surgery_number',
        'patient_id',
        'visit_id',
        'requesting_doctor_id',
        'operator_doctor_id',
        'anesthesiologist_doctor_id',
        'operation_type_id',
        'operating_room_id',
        'priority',
        'status',
        'preoperative_diagnosis',
        'planned_procedure',
        'scheduled_start_at',
        'scheduled_end_at',
        'duration_minutes',
        'consent_obtained',
        'consent_obtained_at',
        'consent_recorded_by',
        'fasting_status',
        'supporting_examinations',
        'patient_preparation',
        'started_at',
        'ended_at',
        'postoperative_diagnosis',
        'performed_procedure',
        'operation_notes',
        'complications',
        'blood_loss_ml',
        'postoperative_instructions',
        'postoperative_patient_status',
        'cancel_reason',
        'cancelled_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'priority' => SurgeryPriority::class,
        'status' => SurgeryStatus::class,
        'fasting_status' => FastingStatus::class,
        'consent_obtained' => 'boolean',
        'consent_obtained_at' => 'datetime',
        'scheduled_start_at' => 'datetime',
        'scheduled_end_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function requestingDoctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'requesting_doctor_id');
    }

    public function operatorDoctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'operator_doctor_id');
    }

    public function anesthesiologistDoctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'anesthesiologist_doctor_id');
    }

    public function operationType(): BelongsTo
    {
        return $this->belongsTo(OperationType::class, 'operation_type_id');
    }

    public function operatingRoom(): BelongsTo
    {
        return $this->belongsTo(OperatingRoom::class);
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(SurgeryTeamMember::class);
    }

    public function safetyChecklist(): HasOne
    {
        return $this->hasOne(SurgerySafetyChecklist::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(OperatingRoomUsage::class);
    }

    public function recovery(): HasOne
    {
        return $this->hasOne(SurgeryRecovery::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(SurgeryClinicalHistory::class);
    }
}
