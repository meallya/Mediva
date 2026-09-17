<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route/middleware + server policy remains source of truth.
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer'],
            'visit_id' => ['required', 'integer'],
            'requesting_doctor_id' => ['nullable', 'integer'],
            'operator_doctor_id' => ['nullable', 'integer'],
            'anesthesiologist_doctor_id' => ['nullable', 'integer'],
            'operation_type_id' => ['nullable', 'exists:operating_room_operation_types,id'],
            'operating_room_id' => ['nullable', 'exists:operating_rooms,id'],
            'priority' => ['required', Rule::in(['elective', 'urgent', 'emergency'])],
            'preoperative_diagnosis' => ['nullable', 'string'],
            'planned_procedure' => ['nullable', 'string'],
            'scheduled_start_at' => ['nullable', 'date'],
            'scheduled_end_at' => ['nullable', 'date', 'after:scheduled_start_at'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'consent_obtained' => ['sometimes', 'boolean'],
            'fasting_status' => ['nullable', Rule::in([
                'not_required', 'not_started', 'in_progress', 'adequate', 'not_adequate'
            ])],
            'supporting_examinations' => ['nullable', 'string'],
            'patient_preparation' => ['nullable', 'string'],
        ];
    }
}
