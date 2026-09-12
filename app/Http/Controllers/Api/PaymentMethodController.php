<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PaymentMethod::query()
            ->withCount('visits');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($query) use ($search) {
                $query
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
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
        $data = $this->validatePaymentMethod($request);

        $paymentMethod = PaymentMethod::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'payment_method.create',
            module: 'master_data',
            description: 'Master metode bayar dibuat.',
            newValues: $paymentMethod->toArray(),
        );

        return response()->json([
            'message' => 'Metode bayar berhasil ditambahkan.',
            'data' => $paymentMethod,
        ], 201);
    }

    public function show(PaymentMethod $paymentMethod): JsonResponse
    {
        return response()->json([
            'data' => $paymentMethod->loadCount('visits'),
        ]);
    }

    public function update(
        Request $request,
        PaymentMethod $paymentMethod
    ): JsonResponse {
        $data = $this->validatePaymentMethod(
            $request,
            $paymentMethod->id,
        );

        $oldValues = $paymentMethod->toArray();

        $paymentMethod->update([
            ...$data,
            'is_active' => $data['is_active'] ?? $paymentMethod->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'payment_method.update',
            module: 'master_data',
            description: 'Master metode bayar diperbarui.',
            oldValues: $oldValues,
            newValues: $paymentMethod->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Metode bayar berhasil diperbarui.',
            'data' => $paymentMethod->fresh()->loadCount('visits'),
        ]);
    }

    public function toggleStatus(
        Request $request,
        PaymentMethod $paymentMethod
    ): JsonResponse {
        $oldValues = $paymentMethod->toArray();

        $paymentMethod->update([
            'is_active' => ! $paymentMethod->is_active,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'payment_method.status',
            module: 'master_data',
            description: 'Status master metode bayar diubah.',
            oldValues: $oldValues,
            newValues: $paymentMethod->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Status metode bayar berhasil diubah.',
            'data' => $paymentMethod->fresh()->loadCount('visits'),
        ]);
    }

    private function validatePaymentMethod(
        Request $request,
        ?int $ignoreId = null
    ): array {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('payment_methods', 'code')->ignore($ignoreId),
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
                'sometimes',
                'boolean',
            ],
        ]);
    }
}
