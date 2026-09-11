<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $patient = $this->route(
            'patient'
        );

        return [
            'nik' => [
                'nullable',
                'digits:16',

                Rule::unique(
                    'patients',
                    'nik'
                )->ignore(
                    $patient->id
                ),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'gender' => [
                'required',
                'in:male,female',
            ],

            'date_of_birth' => [
                'required',
                'date',
                'before_or_equal:today',
            ],

            'address' => [
                'nullable',
                'string',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'blood_type' => [
                'nullable',
                'in:A,B,AB,O',
            ],

            'emergency_contact' => [
                'nullable',
                'string',
                'max:255',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}