<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'operator_doctor_id' => ['nullable', 'integer'],
            'anesthesiologist_doctor_id' => ['nullable', 'integer'],
            'operation_type_id' => ['nullable', 'exists:operating_room_operation_types,id'],
            'operating_room_id' => ['nullable', 'exists:operating_rooms,id'],
            'priority' => ['sometimes', Rule::in(['elective', 'urgent', 'emergency'])],
            'preoperative_diagnosis' => ['nullable', 'string'],
            'planned_procedure' => ['nullable', 'string'],
            'consent_obtained' => ['sometimes', 'boolean'],
            'fasting_status' => ['nullable', Rule::in([
                'not_required', 'not_started', 'in_progress', 'adequate', 'not_adequate'
            ])],
            'supporting_examinations' => ['nullable', 'string'],
            'patient_preparation' => ['nullable', 'string'],
            'postoperative_diagnosis' => ['nullable', 'string'],
            'performed_procedure' => ['nullable', 'string'],
            'operation_notes' => ['nullable', 'string'],
            'complications' => ['nullable', 'string'],
            'blood_loss_ml' => ['nullable', 'integer', 'min:0'],
            'postoperative_instructions' => ['nullable', 'string'],
            'postoperative_patient_status' => ['nullable', Rule::in([
                'stable', 'observation', 'ward', 'icu', 'hcu', 'referred', 'deceased'
            ])],
        ];
    }
}
