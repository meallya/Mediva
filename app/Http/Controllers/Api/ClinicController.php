<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClinicController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $query = Unit::query()
            ->where(
                'type',
                'medical'
            );

        if ($request->filled('search')) {
            $search =
                trim($request->search);

            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'code',
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
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:100',
                'unique:units,code',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $clinic = Unit::create([
            ...$data,

            'type' =>
                'medical',
        ]);

        return response()->json([
            'message' =>
                'Poli berhasil ditambahkan.',

            'data' =>
                $clinic,
        ], 201);
    }

    public function show(
        int $clinic
    ): JsonResponse {
        $unit = Unit::query()
            ->where(
                'type',
                'medical'
            )
            ->findOrFail(
                $clinic
            );

        $unit->load(
            'doctors.employee'
        );

        return response()->json([
            'data' =>
                $unit,
        ]);
    }

    public function update(
        Request $request,
        int $clinic
    ): JsonResponse {
        $unit = Unit::query()
            ->where(
                'type',
                'medical'
            )
            ->findOrFail(
                $clinic
            );

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:100',

                Rule::unique(
                    'units',
                    'code'
                )->ignore(
                    $unit->id
                ),
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $unit->update([
            ...$data,

            'type' =>
                'medical',
        ]);

        return response()->json([
            'message' =>
                'Poli berhasil diperbarui.',

            'data' =>
                $unit,
        ]);
    }
}