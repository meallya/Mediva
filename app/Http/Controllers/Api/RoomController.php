<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    private function roomTypes(): array
    {
        return [
            'outpatient',
            'inpatient',
            'emergency',
            'operating',
            'laboratory',
            'radiology',
            'pharmacy',
            'office',
            'warehouse',
            'other',
        ];
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'units' => Unit::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get([
                        'id',
                        'name',
                        'code',
                        'type',
                    ]),

                'room_types' => $this->roomTypes(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Room::query()
            ->with('unit:id,name,code,type')
            ->latest('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($query) use ($search) {
                $query
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('floor', 'like', "%{$search}%")
                    ->orWhereHas('unit', function ($unit) use ($search) {
                        $unit
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if (
            $request->filled('room_type')
            && $request->room_type !== 'all'
        ) {
            $query->where('room_type', $request->room_type);
        }

        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->integer('unit_id'));
        }

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json(
            $query->paginate($perPage)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateRoom($request);

        $room = Room::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'room.create',
            module: 'master_data',
            description: 'Master ruangan dibuat.',
            newValues: $room->toArray(),
        );

        return response()->json([
            'message' => 'Ruangan berhasil ditambahkan.',
            'data' => $room->load('unit'),
        ], 201);
    }

    public function show(Room $room): JsonResponse
    {
        return response()->json([
            'data' => $room->load('unit'),
        ]);
    }

    public function update(
        Request $request,
        Room $room
    ): JsonResponse {
        $data = $this->validateRoom(
            $request,
            $room->id,
        );

        $oldValues = $room->toArray();

        $room->update([
            ...$data,
            'is_active' => $data['is_active'] ?? $room->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'room.update',
            module: 'master_data',
            description: 'Master ruangan diperbarui.',
            oldValues: $oldValues,
            newValues: $room->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Ruangan berhasil diperbarui.',
            'data' => $room->fresh('unit'),
        ]);
    }

    public function toggleStatus(
        Request $request,
        Room $room
    ): JsonResponse {
        $oldValues = $room->toArray();

        $room->update([
            'is_active' => ! $room->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'room.status',
            module: 'master_data',
            description: 'Status master ruangan diubah.',
            oldValues: $oldValues,
            newValues: $room->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status ruangan berhasil diubah.',
            'data' => $room->fresh('unit'),
        ]);
    }

    private function validateRoom(
        Request $request,
        ?int $ignoreId = null
    ): array {
        return $request->validate([
            'unit_id' => [
                'nullable',
                'integer',
                'exists:units,id',
            ],

            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('rooms', 'code')->ignore($ignoreId),
            ],

            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'room_type' => [
                'required',
                Rule::in($this->roomTypes()),
            ],

            'floor' => [
                'nullable',
                'string',
                'max:50',
            ],

            'capacity' => [
                'required',
                'integer',
                'min:1',
                'max:9999',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);
    }
}
