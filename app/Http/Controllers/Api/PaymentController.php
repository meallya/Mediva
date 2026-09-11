<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\AuditLogger;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function __construct(
        private readonly BillingService $billingService,
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION HISTORY
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->with([
                'invoice.patient',
                'paymentMethod',
                'creator',
                'voider',
            ])
            ->latest('paid_at');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('payment_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('invoice', function ($query) use ($search) {
                        $query
                            ->where('invoice_number', 'like', "%{$search}%")
                            ->orWhereHas('patient', function ($query) use ($search) {
                                $query
                                    ->where('name', 'like', "%{$search}%")
                                    ->orWhere(
                                        'medical_record_number',
                                        'like',
                                        "%{$search}%",
                                    );
                            });
                    });
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($date = $request->query('date')) {
            $query->whereDate('paid_at', $date);
        }

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json(
            $query->paginate($perPage),
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PAYMENT
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request,
        Invoice $invoice,
    ): JsonResponse {
        $validated = $request->validate([
            'payment_method_id' => [
                'required',
                'integer',
                Rule::exists('payment_methods', 'id'),
            ],
            'amount' => ['required', 'numeric', 'gt:0'],
            'paid_at' => ['nullable', 'date'],
            'reference_number' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $payment = $this->billingService->recordPayment(
            $invoice,
            $validated,
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.payment.create',
            module: 'billing',
            description: 'Kasir mencatat pembayaran invoice.',
            newValues: $payment->toArray(),
        );

        return response()->json([
            'message' => 'Pembayaran berhasil dicatat.',
            'data' => $payment,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | VOID PAYMENT
    |--------------------------------------------------------------------------
    */

    public function void(
        Request $request,
        Invoice $invoice,
        Payment $payment,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        if ($payment->invoice_id !== $invoice->id) {
            abort(404);
        }

        $oldValues = $payment->toArray();

        $payment = $this->billingService->voidPayment(
            $payment,
            $validated['reason'],
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.payment.void',
            module: 'billing',
            description: 'Kasir melakukan void pembayaran.',
            oldValues: $oldValues,
            newValues: $payment->toArray(),
        );

        return response()->json([
            'message' => 'Pembayaran berhasil di-void.',
            'data' => $payment,
        ]);
    }
}
