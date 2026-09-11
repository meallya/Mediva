<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Tariff;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TariffController extends Controller
{
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'categories' => [
                    ['value' => 'registration', 'label' => 'Pendaftaran'],
                    ['value' => 'doctor_service', 'label' => 'Jasa Dokter'],
                    ['value' => 'procedure', 'label' => 'Tindakan'],
                    ['value' => 'other_service', 'label' => 'Biaya Lain'],
                ],
                'units' => Unit::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),
                'doctors' => Doctor::query()
                    ->with('employee:id,name')
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->get()
                    ->map(fn (Doctor $doctor) => [
                        'id' => $doctor->id,
                        'name' => $doctor->employee?->name ?? "Dokter #{$doctor->id}",
                        'specialization' => $doctor->specialization,
                    ])
                    ->values(),
            ],
        ]);
    }

    private function categories(): array
    {
        return [
            'registration',
            'doctor_service',
            'procedure',
            'other_service',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = Tariff::query()
            ->with([
                'unit',
                'doctor.employee',
            ])
            ->latest('id');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('reference_code', 'like', "%{$search}%");
            });
        }

        if ($category = $request->query('category')) {
            if ($category !== 'all') {
                $query->where('category', $category);
            }
        }

        if ($status = $request->query('status')) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json(
            $query->paginate($perPage),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateTariff($request);

        $tariff = Tariff::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'tariff.create',
            module: 'billing',
            description: 'Tarif baru dibuat.',
            newValues: $tariff->toArray(),
        );

        return response()->json([
            'message' => 'Tarif berhasil dibuat.',
            'data' => $tariff->load(['unit', 'doctor.employee']),
        ], 201);
    }

    public function update(
        Request $request,
        Tariff $tariff,
    ): JsonResponse {
        $validated = $this->validateTariff(
            $request,
            $tariff->id,
        );

        $oldValues = $tariff->toArray();

        $tariff->update([
            ...$validated,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'tariff.update',
            module: 'billing',
            description: 'Tarif diubah.',
            oldValues: $oldValues,
            newValues: $tariff->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Tarif berhasil diubah.',
            'data' => $tariff->fresh(['unit', 'doctor.employee']),
        ]);
    }

    public function toggleStatus(
        Request $request,
        Tariff $tariff,
    ): JsonResponse {
        $oldValues = $tariff->toArray();

        $tariff->update([
            'is_active' => !$tariff->is_active,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'tariff.status',
            module: 'billing',
            description: 'Status tarif diubah.',
            oldValues: $oldValues,
            newValues: $tariff->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status tarif berhasil diubah.',
            'data' => $tariff->fresh(['unit', 'doctor.employee']),
        ]);
    }

    private function validateTariff(
        Request $request,
        ?int $ignoreId = null,
    ): array {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('tariffs', 'code')->ignore($ignoreId),
            ],
            'name' => ['required', 'string', 'max:150'],
            'category' => [
                'required',
                Rule::in($this->categories()),
            ],
            'amount' => ['required', 'numeric', 'min:0'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'reference_code' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
