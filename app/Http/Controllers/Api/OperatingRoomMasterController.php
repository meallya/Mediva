<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperatingRoom;
use App\Models\OperationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OperatingRoomMasterController extends Controller
{
    public function operationTypes(): JsonResponse
    {
        return response()->json(['data' => OperationType::orderBy('name')->get()]);
    }

    public function storeOperationType(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:operating_room_operation_types,code'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'default_duration_minutes' => ['nullable', 'integer', 'min:1'],
            'default_tariff' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Jenis operasi berhasil dibuat.',
            'data' => OperationType::create($data),
        ], 201);
    }

    public function updateOperationType(Request $request, OperationType $operationType): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:30', Rule::unique('operating_room_operation_types', 'code')->ignore($operationType->id)],
            'name' => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'default_duration_minutes' => ['nullable', 'integer', 'min:1'],
            'default_tariff' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $operationType->update($data);

        return response()->json(['message' => 'Jenis operasi diperbarui.', 'data' => $operationType->fresh()]);
    }

    public function rooms(): JsonResponse
{
    return response()->json([
        'data' => OperatingRoom::orderBy('name')->get()
    ]);
}

    public function storeRoom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:operating_rooms,code'],
            'name' => ['required', 'string', 'max:120'],
            'hospital_room_id' => ['nullable', 'integer'],
            'status' => ['required', Rule::in(['available', 'maintenance', 'inactive'])],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Kamar operasi berhasil dibuat.',
            'data' => OperatingRoom::create($data),
        ], 201);
    }

    public function updateRoom(Request $request, OperatingRoom $operatingRoom): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:30', Rule::unique('operating_rooms', 'code')->ignore($operatingRoom->id)],
            'name' => ['sometimes', 'string', 'max:120'],
            'hospital_room_id' => ['nullable', 'integer'],
            'status' => ['sometimes', Rule::in(['available', 'maintenance', 'inactive'])],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $operatingRoom->update($data);

        return response()->json(['message' => 'Kamar operasi diperbarui.', 'data' => $operatingRoom->fresh()]);
    }
}
