<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TeamRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'members' => ['required', 'array'],
            'members.*.employee_id' => ['nullable', 'integer'],
            'members.*.doctor_id' => ['nullable', 'integer'],
            'members.*.role' => ['required', Rule::in([
                'operator', 'anesthesiologist', 'assistant',
                'instrument_nurse', 'circulating_nurse', 'other'
            ])],
            'members.*.display_name' => ['nullable', 'string', 'max:150'],
            'members.*.notes' => ['nullable', 'string'],
        ];
    }
}
