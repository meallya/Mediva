<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Visit;
use App\Services\AuditLogger;
use App\Services\BillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BillingController extends Controller
{
    public function __construct(
        private readonly BillingService $billingService,
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | LIST INVOICE
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::query()
            ->with([
                'patient',
                'visit.unit',
                'visit.doctor.employee',
            ])
            ->latest('generated_at');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($query) use ($search) {
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
                    })
                    ->orWhereHas('visit', function ($query) use ($search) {
                        $query->where(
                            'visit_number',
                            'like',
                            "%{$search}%",
                        );
                    });
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($date = $request->query('date')) {
            $query->whereDate('generated_at', $date);
        }

        $perPage = max(5, min((int) $request->query('per_page', 15), 100));

        return response()->json(
            $query->paginate($perPage),
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETED VISITS YANG BELUM PUNYA INVOICE
    |--------------------------------------------------------------------------
    */

    public function candidates(Request $request): JsonResponse
    {
        $query = Visit::query()
            ->with([
                'patient',
                'unit',
                'doctor.employee',
            ])
            ->where('status', 'completed')
            ->whereNotIn(
                'id',
                Invoice::query()->select('visit_id'),
            )
            ->latest('completed_at');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('visit_number', 'like', "%{$search}%")
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
        }

        return response()->json([
            'data' => $query->limit(50)->get(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY DASHBOARD KEUANGAN
    |--------------------------------------------------------------------------
    */

    public function summary(): JsonResponse
    {
        $today = now()->toDateString();

        return response()->json([
            'data' => [
                'unpaid' => Invoice::query()
                    ->where('status', 'unpaid')
                    ->count(),

                'partial' => Invoice::query()
                    ->where('status', 'partial')
                    ->count(),

                'paid_today' => Invoice::query()
                    ->where('status', 'paid')
                    ->whereHas('payments', function ($query) use ($today) {
                        $query
                            ->where('status', 'posted')
                            ->whereDate('paid_at', $today);
                    })
                    ->count(),

                'revenue_today' => DB::table('payments')
                    ->where('status', 'posted')
                    ->whereDate('paid_at', $today)
                    ->sum('amount'),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        Invoice $invoice,
    ): JsonResponse {
        $invoice->load([
            'patient',
            'visit.unit',
            'visit.doctor.employee',
            'items.tariff',
            'payments.paymentMethod',
            'payments.creator',
            'payments.voider',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'billing.view',
            module: 'billing',
            description: 'Pengguna melihat detail billing.',
            newValues: [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
            ],
        );

        return response()->json([
            'data' => $invoice,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE / SYNC
    |--------------------------------------------------------------------------
    */

    public function generate(
        Request $request,
        Visit $visit,
    ): JsonResponse {
        $invoice = $this->billingService->generateForVisit(
            $visit,
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.generate',
            module: 'billing',
            description: 'Billing dibuat atau disinkronkan dari kunjungan.',
            newValues: [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'visit_id' => $visit->id,
                'grand_total' => $invoice->grand_total,
            ],
        );

        return response()->json([
            'message' => 'Billing berhasil dibuat / disinkronkan.',
            'data' => $invoice,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | ADD MANUAL OTHER SERVICE
    |--------------------------------------------------------------------------
    */

    public function addItem(
        Request $request,
        Invoice $invoice,
    ): JsonResponse {
        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $item = $this->billingService->addManualItem(
            $invoice,
            $validated,
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.item.create',
            module: 'billing',
            description: 'Kasir menambahkan biaya lain secara manual.',
            newValues: $item->toArray(),
        );

        return response()->json([
            'message' => 'Biaya lain berhasil ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function updateItem(
        Request $request,
        Invoice $invoice,
        InvoiceItem $item,
    ): JsonResponse {
        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $oldValues = $item->toArray();

        $item = $this->billingService->updateManualItem(
            $invoice,
            $item,
            $validated,
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.item.update',
            module: 'billing',
            description: 'Kasir mengubah biaya lain pada billing.',
            oldValues: $oldValues,
            newValues: $item->toArray(),
        );

        return response()->json([
            'message' => 'Item billing berhasil diubah.',
            'data' => $item,
        ]);
    }

    public function deleteItem(
        Request $request,
        Invoice $invoice,
        InvoiceItem $item,
    ): JsonResponse {
        $oldValues = $item->toArray();

        $this->billingService->deleteManualItem(
            $invoice,
            $item,
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.item.delete',
            module: 'billing',
            description: 'Kasir menghapus biaya lain dari billing.',
            oldValues: $oldValues,
        );

        return response()->json([
            'message' => 'Item billing berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    public function cancel(
        Request $request,
        Invoice $invoice,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $oldValues = $invoice->toArray();

        $invoice = $this->billingService->cancelInvoice(
            $invoice,
            $validated['reason'],
            $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'billing.cancel',
            module: 'billing',
            description: 'Kasir membatalkan invoice.',
            oldValues: $oldValues,
            newValues: $invoice->toArray(),
        );

        return response()->json([
            'message' => 'Invoice berhasil dibatalkan.',
            'data' => $invoice,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHOD OPTIONS UNTUK KASIR
    |--------------------------------------------------------------------------
    |
    | Endpoint terpisah ini sengaja tidak memakai user.manage.
    |
    */

    public function paymentMethods(): JsonResponse
    {
        if (!Schema::hasTable('payment_methods')) {
            return response()->json([
                'data' => [],
            ]);
        }

        $columns = Schema::getColumnListing('payment_methods');

        $query = DB::table('payment_methods');

        if (in_array('is_active', $columns, true)) {
            $query->where('is_active', true);
        }

        $methods = $query
            ->orderBy(
                in_array('name', $columns, true)
                    ? 'name'
                    : 'id',
            )
            ->get()
            ->map(function ($row) use ($columns) {
                return [
                    'id' => $row->id,
                    'code' => in_array('code', $columns, true)
                        ? $row->code
                        : null,
                    'name' => in_array('name', $columns, true)
                        ? $row->name
                        : (
                            in_array('label', $columns, true)
                                ? $row->label
                                : "Metode #{$row->id}"
                        ),
                ];
            })
            ->values();

        return response()->json([
            'data' => $methods,
        ]);
    }
}
