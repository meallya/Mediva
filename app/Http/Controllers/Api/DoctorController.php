<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Unit;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DoctorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Doctor::query()
            ->with([
                'employee',
                'units',
            ]);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($query) use ($search) {
                $query
                    ->where('sip_number', 'like', "%{$search}%")
                    ->orWhere('specialization', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($employee) use ($search) {
                        $employee
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('employee_number', 'like', "%{$search}%");
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

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json(
            $query
                ->latest('id')
                ->paginate($perPage)
        );
    }

    public function options(Request $request): JsonResponse
    {
        $doctorId = $request->integer('doctor_id');

        $employeeQuery = Employee::query()
            ->select([
                'id',
                'employee_number',
                'name',
            ])
            ->where('is_active', true)
            ->where(function ($query) use ($doctorId) {
                $query->whereDoesntHave('doctor');

                if ($doctorId) {
                    $query->orWhereHas('doctor', function ($doctor) use ($doctorId) {
                        $doctor->where('id', $doctorId);
                    });
                }
            })
            ->orderBy('name');

        return response()->json([
            'employees' => $employeeQuery->get(),

            'units' => Unit::query()
                ->select([
                    'id',
                    'name',
                    'code',
                    'queue_prefix',
                ])
                ->where('type', 'medical')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateDoctor($request);

        $doctor = DB::transaction(function () use ($data) {
            $doctor = Doctor::create([
                'employee_id' => $data['employee_id'],
                'sip_number' => $data['sip_number'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $doctor->units()->sync($data['unit_ids']);

            return $doctor;
        });

        $doctor->load([
            'employee',
            'units',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'doctor.create',
            module: 'master_data',
            description: 'Master dokter dibuat.',
            newValues: [
                ...$doctor->toArray(),
                'unit_ids' => $doctor->units->pluck('id')->all(),
            ],
        );

        return response()->json([
            'message' => 'Dokter berhasil ditambahkan.',
            'data' => $doctor,
        ], 201);
    }

    public function show(Doctor $doctor): JsonResponse
    {
        $doctor->load([
            'employee',
            'units',
        ]);

        return response()->json([
            'data' => $doctor,
        ]);
    }

    public function update(
        Request $request,
        Doctor $doctor
    ): JsonResponse {
        $data = $this->validateDoctor(
            $request,
            $doctor->id,
        );

        $doctor->load('units');

        $oldValues = [
            ...$doctor->toArray(),
            'unit_ids' => $doctor->units->pluck('id')->all(),
        ];

        DB::transaction(function () use ($doctor, $data) {
            $doctor->update([
                'employee_id' => $data['employee_id'],
                'sip_number' => $data['sip_number'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'is_active' => $data['is_active'] ?? $doctor->is_active,
            ]);

            $doctor->units()->sync($data['unit_ids']);
        });

        $doctor->load([
            'employee',
            'units',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'doctor.update',
            module: 'master_data',
            description: 'Master dokter diperbarui.',
            oldValues: $oldValues,
            newValues: [
                ...$doctor->fresh()->toArray(),
                'unit_ids' => $doctor->units->pluck('id')->all(),
            ],
        );

        return response()->json([
            'message' => 'Data dokter berhasil diperbarui.',
            'data' => $doctor,
        ]);
    }

    public function toggleStatus(
        Request $request,
        Doctor $doctor
    ): JsonResponse {
        $oldValues = $doctor->toArray();

        $doctor->update([
            'is_active' => ! $doctor->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'doctor.status',
            module: 'master_data',
            description: 'Status master dokter diubah.',
            oldValues: $oldValues,
            newValues: $doctor->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status dokter berhasil diubah.',
            'data' => $doctor->fresh(['employee', 'units']),
        ]);
    }

    private function validateDoctor(
        Request $request,
        ?int $ignoreId = null
    ): array {
        return $request->validate([
            'employee_id' => [
                'required',
                'integer',
                'exists:employees,id',
                Rule::unique('doctors', 'employee_id')->ignore($ignoreId),
            ],

            'sip_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('doctors', 'sip_number')->ignore($ignoreId),
            ],

            'specialization' => [
                'nullable',
                'string',
                'max:150',
            ],

            'unit_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'unit_ids.*' => [
                'integer',
                Rule::exists('units', 'id')->where(function ($query) {
                    $query
                        ->where('type', 'medical')
                        ->where('is_active', true);
                }),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);
    }
}
