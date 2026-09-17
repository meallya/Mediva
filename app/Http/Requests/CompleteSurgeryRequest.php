<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteSurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'postoperative_patient_status' => ['nullable', Rule::in([
                'stable', 'observation', 'ward', 'icu', 'hcu', 'referred', 'deceased',
            ])],
            'postoperative_instructions' => ['nullable', 'string'],
        ];
    }
}
