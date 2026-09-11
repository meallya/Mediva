<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DoctorController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $query = Doctor::query()
            ->with([
                'employee',
                'units',
            ]);

        if ($request->filled('search')) {
            $search =
                trim($request->search);

            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'sip_number',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'specialization',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhereHas(
                            'employee',
                            function ($employee) use ($search) {
                                $employee->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                );
                            }
                        );
                }
            );
        }

        return response()->json(
            $query
                ->latest('id')
                ->paginate(20)
        );
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'employees' =>
                Employee::query()
                    ->select([
                        'id',
                        'employee_number',
                        'name',
                    ])
                    ->where(
                        'is_active',
                        true
                    )
                    ->orderBy('name')
                    ->get(),

            'units' =>
                Unit::query()
                    ->select([
                        'id',
                        'name',
                        'code',
                    ])
                    ->where(
                        'type',
                        'medical'
                    )
                    ->where(
                        'is_active',
                        true
                    )
                    ->orderBy('name')
                    ->get(),
        ]);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $data = $request->validate([
            'employee_id' => [
                'required',
                'integer',
                'exists:employees,id',
                'unique:doctors,employee_id',
            ],

            'sip_number' => [
                'nullable',
                'string',
                'max:100',
                'unique:doctors,sip_number',
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
                'exists:units,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $doctor = DB::transaction(
            function () use ($data) {
                $doctor =
                    Doctor::create([
                        'employee_id' =>
                            $data[
                                'employee_id'
                            ],

                        'sip_number' =>
                            $data[
                                'sip_number'
                            ] ?? null,

                        'specialization' =>
                            $data[
                                'specialization'
                            ] ?? null,

                        'is_active' =>
                            $data[
                                'is_active'
                            ] ?? true,
                    ]);

                $doctor
                    ->units()
                    ->sync(
                        $data[
                            'unit_ids'
                        ]
                    );

                return $doctor;
            }
        );

        $doctor->load([
            'employee',
            'units',
        ]);

        return response()->json([
            'message' =>
                'Dokter berhasil ditambahkan.',

            'data' =>
                $doctor,
        ], 201);
    }

    public function show(
        Doctor $doctor
    ): JsonResponse {
        $doctor->load([
            'employee',
            'units',
        ]);

        return response()->json([
            'data' =>
                $doctor,
        ]);
    }

    public function update(
        Request $request,
        Doctor $doctor
    ): JsonResponse {
        $data = $request->validate([
            'employee_id' => [
                'required',
                'integer',
                'exists:employees,id',

                Rule::unique(
                    'doctors',
                    'employee_id'
                )->ignore(
                    $doctor->id
                ),
            ],

            'sip_number' => [
                'nullable',
                'string',
                'max:100',

                Rule::unique(
                    'doctors',
                    'sip_number'
                )->ignore(
                    $doctor->id
                ),
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
                'exists:units,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        DB::transaction(
            function () use (
                $doctor,
                $data
            ) {
                $doctor->update([
                    'employee_id' =>
                        $data[
                            'employee_id'
                        ],

                    'sip_number' =>
                        $data[
                            'sip_number'
                        ] ?? null,

                    'specialization' =>
                        $data[
                            'specialization'
                        ] ?? null,

                    'is_active' =>
                        $data[
                            'is_active'
                        ] ?? true,
                ]);

                $doctor
                    ->units()
                    ->sync(
                        $data[
                            'unit_ids'
                        ]
                    );
            }
        );

        $doctor->load([
            'employee',
            'units',
        ]);

        return response()->json([
            'message' =>
                'Data dokter berhasil diperbarui.',

            'data' =>
                $doctor,
        ]);
    }
}