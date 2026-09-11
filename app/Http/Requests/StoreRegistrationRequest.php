<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => [
                'required',
                'integer',
                'exists:patients,id',
            ],

            'unit_id' => [
                'required',
                'integer',
                'exists:units,id',
            ],

            'visit_type' => [
                'required',
                'string',
                'in:outpatient,emergency,inpatient,medical_checkup,day_care,home_care,telemedicine',
            ],

            'complaint' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' =>
                'Pasien wajib dipilih.',

            'patient_id.exists' =>
                'Pasien tidak ditemukan.',

            'unit_id.required' =>
                'Poli / unit pelayanan wajib dipilih.',

            'unit_id.exists' =>
                'Poli / unit pelayanan tidak ditemukan.',

            'visit_type.required' =>
                'Jenis kunjungan wajib dipilih.',

            'visit_type.in' =>
                'Jenis kunjungan tidak valid.',

            'complaint.max' =>
                'Keluhan maksimal 2000 karakter.',
        ];
    }
}