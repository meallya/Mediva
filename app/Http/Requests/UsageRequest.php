<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UsageRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'usage_type' => ['required', Rule::in(['medicine', 'medical_material', 'asset'])],
            'medicine_id' => ['nullable', 'integer', 'required_if:usage_type,medicine'],
            'inventory_item_id' => ['nullable', 'integer', 'required_if:usage_type,medical_material'],
            'asset_id' => ['nullable', 'integer', 'required_if:usage_type,asset'],
            'item_name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit' => ['nullable', 'string', 'max:30'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'billable' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
