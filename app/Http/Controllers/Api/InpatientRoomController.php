<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InpatientRoom;
use App\Models\Room;
use App\Services\AuditLogger;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InpatientRoomController extends Controller
{
    private function wardTypes(): array
    {
        return [
            'inpatient',
            'icu',
            'hcu',
            'nicu',
            'picu',
            'isolation',
            'perinatology',
            'maternity',
        ];
    }

    private function roomClasses(): array
    {
        return [
            'vvip',
            'vip',
            'class_1',
            'class_2',
            'class_3',
            'non_class',
        ];
    }

    public function options(): JsonResponse
    {
        $rooms = Room::query()
            ->where('is_active', true)
            ->where('room_type', 'inpatient')
            ->with([
                'unit:id,name,code',
                'inpatientRoom:id,room_id',
            ])
            ->orderBy('name')
            ->get([
                'id',
                'unit_id',
                'code',
                'name',
                'floor',
            ])
            ->map(function (Room $room) {
                return [
                    'id' => $room->id,
                    'code' => $room->code,
                    'name' => $room->name,
                    'floor' => $room->floor,
                    'unit' => $room->unit,
                    'inpatient_room_id' => $room->inpatientRoom?->id,
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'rooms' => $rooms,
                'ward_types' => $this->wardTypes(),
                'room_classes' => $this->roomClasses(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = InpatientRoom::query()
            ->with([
                'room:id,unit_id,code,name,floor,is_active',
                'room.unit:id,name,code',
            ])
            ->latest('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->whereHas('room', function ($room) use ($search) {
                $room
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
            $request->filled('ward_type')
            && $request->ward_type !== 'all'
        ) {
            $query->where('ward_type', $request->ward_type);
        }

        if (
            $request->filled('room_class')
            && $request->room_class !== 'all'
        ) {
            $query->where('room_class', $request->room_class);
        }

        $perPage = max(
            5,
            min((int) $request->query('per_page', 20), 100)
        );

        return response()->json(
            $query->paginate($perPage)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateInpatientRoom($request);

        $inpatientRoom = InpatientRoom::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inpatient_room.create',
            module: 'master_data',
            description: 'Master kamar rawat inap dibuat.',
            newValues: $inpatientRoom->toArray(),
        );

        return response()->json([
            'message' => 'Kamar rawat inap berhasil ditambahkan.',
            'data' => $inpatientRoom->load(['room.unit']),
        ], 201);
    }

    public function show(InpatientRoom $inpatientRoom): JsonResponse
    {
        return response()->json([
            'data' => $inpatientRoom->load(['room.unit']),
        ]);
    }

    public function update(
        Request $request,
        InpatientRoom $inpatientRoom
    ): JsonResponse {
        $data = $this->validateInpatientRoom(
            $request,
            $inpatientRoom->id,
        );

        $oldValues = $inpatientRoom->toArray();

        $inpatientRoom->update([
            ...$data,
            'is_active' => $data['is_active'] ?? $inpatientRoom->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inpatient_room.update',
            module: 'master_data',
            description: 'Master kamar rawat inap diperbarui.',
            oldValues: $oldValues,
            newValues: $inpatientRoom->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Kamar rawat inap berhasil diperbarui.',
            'data' => $inpatientRoom->fresh(['room.unit']),
        ]);
    }

    public function toggleStatus(
        Request $request,
        InpatientRoom $inpatientRoom
    ): JsonResponse {
        $oldValues = $inpatientRoom->toArray();

        $inpatientRoom->update([
            'is_active' => ! $inpatientRoom->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inpatient_room.status',
            module: 'master_data',
            description: 'Status master kamar rawat inap diubah.',
            oldValues: $oldValues,
            newValues: $inpatientRoom->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status kamar rawat inap berhasil diubah.',
            'data' => $inpatientRoom->fresh(['room.unit']),
        ]);
    }

    public function destroy(
        Request $request,
        InpatientRoom $inpatientRoom
    ): JsonResponse {
        $oldValues = $inpatientRoom->load(['room.unit'])->toArray();

        try {
            $inpatientRoom->delete();
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Kamar rawat inap tidak dapat dihapus karena masih digunakan oleh data lain. Nonaktifkan kamar jika riwayatnya harus tetap dipertahankan.',
            ], 422);
        }

        AuditLogger::log(
            request: $request,
            action: 'inpatient_room.delete',
            module: 'master_data',
            description: 'Master kamar rawat inap dihapus.',
            oldValues: $oldValues,
        );

        return response()->json([
            'message' => 'Kamar rawat inap berhasil dihapus.',
        ]);
    }

    private function validateInpatientRoom(
        Request $request,
        ?int $ignoreId = null
    ): array {
        return $request->validate([
            'room_id' => [
                'required',
                'integer',
                'exists:rooms,id',
                Rule::unique('inpatient_rooms', 'room_id')->ignore($ignoreId),
                function (
                    string $attribute,
                    mixed $value,
                    \Closure $fail
                ): void {
                    $room = Room::query()->find($value);

                    if (! $room || ! $room->is_active) {
                        $fail('Ruangan RS harus aktif.');
                        return;
                    }

                    if ($room->room_type !== 'inpatient') {
                        $fail(
                            'Ruangan RS harus memiliki jenis Rawat Inap sebelum dijadikan kamar rawat inap.'
                        );
                    }
                },
            ],

            'ward_type' => [
                'required',
                Rule::in($this->wardTypes()),
            ],

            'room_class' => [
                'required',
                Rule::in($this->roomClasses()),
            ],

            'bed_capacity' => [
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
