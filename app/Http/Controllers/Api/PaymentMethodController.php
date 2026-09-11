<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $query =
            PaymentMethod::query();

        if ($request->filled('search')) {
            $search =
                trim($request->search);

            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'name',
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
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:payment_methods,code',
            ],

            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'type' => [
                'nullable',
                'string',
                'max:50',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $paymentMethod =
            PaymentMethod::create(
                $data
            );

        return response()->json([
            'message' =>
                'Metode bayar berhasil ditambahkan.',

            'data' =>
                $paymentMethod,
        ], 201);
    }

    public function show(
        PaymentMethod $paymentMethod
    ): JsonResponse {
        return response()->json([
            'data' =>
                $paymentMethod,
        ]);
    }

    public function update(
        Request $request,
        PaymentMethod $paymentMethod
    ): JsonResponse {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',

                Rule::unique(
                    'payment_methods',
                    'code'
                )->ignore(
                    $paymentMethod->id
                ),
            ],

            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'type' => [
                'nullable',
                'string',
                'max:50',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $paymentMethod->update(
            $data
        );

        return response()->json([
            'message' =>
                'Metode bayar berhasil diperbarui.',

            'data' =>
                $paymentMethod,
        ]);
    }
}