<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()
            ->with([
                'doctor:id,employee_id,sip_number,specialization,is_active',
                'user:id,employee_id,username,name,email,is_active',
            ]);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($query) use ($search) {
                $query
                    ->where('employee_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
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
        $data = $this->validateEmployee($request);

        $employee = Employee::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'employee.create',
            module: 'master_data',
            description: 'Master pegawai dibuat.',
            newValues: $employee->toArray(),
        );

        return response()->json([
            'message' => 'Pegawai berhasil ditambahkan.',
            'data' => $employee->load(['doctor', 'user']),
        ], 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        $employee->load([
            'user',
            'doctor.units',
        ]);

        return response()->json([
            'data' => $employee,
        ]);
    }

    public function update(
        Request $request,
        Employee $employee
    ): JsonResponse {
        $data = $this->validateEmployee(
            $request,
            $employee->id,
        );

        $oldValues = $employee->toArray();

        $employee->update([
            ...$data,
            'is_active' => $data['is_active'] ?? $employee->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'employee.update',
            module: 'master_data',
            description: 'Master pegawai diperbarui.',
            oldValues: $oldValues,
            newValues: $employee->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Data pegawai berhasil diperbarui.',
            'data' => $employee->fresh(['doctor', 'user']),
        ]);
    }

    public function toggleStatus(
        Request $request,
        Employee $employee
    ): JsonResponse {
        $oldValues = $employee->toArray();

        $employee->update([
            'is_active' => ! $employee->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'employee.status',
            module: 'master_data',
            description: 'Status master pegawai diubah.',
            oldValues: $oldValues,
            newValues: $employee->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status pegawai berhasil diubah.',
            'data' => $employee->fresh(['doctor', 'user']),
        ]);
    }

    private function validateEmployee(
        Request $request,
        ?int $ignoreId = null
    ): array {
        return $request->validate([
            'employee_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('employees', 'employee_number')->ignore($ignoreId),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);
    }
}
