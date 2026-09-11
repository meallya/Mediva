<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $query = Employee::query()
            ->with('doctor');

        if ($request->filled('search')) {
            $search = trim(
                $request->search
            );

            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'employee_number',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'email',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        return response()->json(
            $query
                ->orderBy('name')
                ->paginate(20)
        );
    }

    public function store(
        Request $request
    ): JsonResponse {
        $data = $request->validate([
            'employee_number' => [
                'nullable',
                'string',
                'max:100',
                'unique:employees,employee_number',
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
                'boolean',
            ],
        ]);

        $employee =
            Employee::create($data);

        return response()->json([
            'message' =>
                'Pegawai berhasil ditambahkan.',

            'data' =>
                $employee,
        ], 201);
    }

    public function show(
        Employee $employee
    ): JsonResponse {
        $employee->load([
            'user',
            'doctor.units',
        ]);

        return response()->json([
            'data' =>
                $employee,
        ]);
    }

    public function update(
        Request $request,
        Employee $employee
    ): JsonResponse {
        $data = $request->validate([
            'employee_number' => [
                'nullable',
                'string',
                'max:100',

                Rule::unique(
                    'employees',
                    'employee_number'
                )->ignore(
                    $employee->id
                ),
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
                'boolean',
            ],
        ]);

        $employee->update($data);

        return response()->json([
            'message' =>
                'Data pegawai berhasil diperbarui.',

            'data' =>
                $employee,
        ]);
    }
}