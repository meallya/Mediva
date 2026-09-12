<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClinicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Unit::query()
            ->where('type', 'medical')
            ->withCount('doctors');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('queue_prefix', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json(
            $query
                ->orderBy('name')
                ->paginate($perPage)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateClinic($request);

        $clinic = Unit::create([
            ...$data,
            'type' => 'medical',
            'is_active' => $data['is_active'] ?? true,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'clinic.create',
            module: 'master_data',
            description: 'Master poli dibuat.',
            newValues: $clinic->toArray(),
        );

        return response()->json([
            'message' => 'Poli berhasil ditambahkan.',
            'data' => $clinic,
        ], 201);
    }

    public function show(int $clinic): JsonResponse
    {
        $unit = Unit::query()
            ->where('type', 'medical')
            ->findOrFail($clinic);

        $unit->load('doctors.employee');

        return response()->json([
            'data' => $unit,
        ]);
    }

    public function update(
        Request $request,
        int $clinic
    ): JsonResponse {
        $unit = Unit::query()
            ->where('type', 'medical')
            ->findOrFail($clinic);

        $data = $this->validateClinic(
            $request,
            $unit->id,
        );

        $oldValues = $unit->toArray();

        $unit->update([
            ...$data,
            'type' => 'medical',
            'is_active' => $data['is_active'] ?? $unit->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'clinic.update',
            module: 'master_data',
            description: 'Master poli diperbarui.',
            oldValues: $oldValues,
            newValues: $unit->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Poli berhasil diperbarui.',
            'data' => $unit->fresh()->loadCount('doctors'),
        ]);
    }

    public function toggleStatus(
        Request $request,
        int $clinic
    ): JsonResponse {
        $unit = Unit::query()
            ->where('type', 'medical')
            ->findOrFail($clinic);

        $oldValues = $unit->toArray();

        $unit->update([
            'is_active' => ! $unit->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'clinic.status',
            module: 'master_data',
            description: 'Status master poli diubah.',
            oldValues: $oldValues,
            newValues: $unit->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status poli berhasil diubah.',
            'data' => $unit->fresh()->loadCount('doctors'),
        ]);
    }

    private function validateClinic(
        Request $request,
        ?int $ignoreId = null
    ): array {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('units', 'code')->ignore($ignoreId),
            ],

            'queue_prefix' => [
                'nullable',
                'string',
                'max:10',
                Rule::unique('units', 'queue_prefix')->ignore($ignoreId),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);
    }
}
