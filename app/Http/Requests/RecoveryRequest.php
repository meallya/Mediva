<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecoveryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'hospital_room_id' => ['nullable', 'integer'],
            'recovery_started_at' => ['nullable', 'date'],
            'recovery_ended_at' => ['nullable', 'date', 'after_or_equal:recovery_started_at'],
            'consciousness' => ['nullable', 'string', 'max:100'],
            'vital_signs' => ['nullable', 'array'],
            'pain_score' => ['nullable', 'integer', 'min:0', 'max:10'],
            'nausea_vomiting' => ['sometimes', 'boolean'],
            'aldrete_score' => ['nullable', 'integer', 'min:0', 'max:10'],
            'status' => ['required', Rule::in([
                'waiting', 'observing', 'ready_transfer', 'transferred', 'escalated'
            ])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
