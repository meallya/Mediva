<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\StockMovement;
use App\Models\Visit;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | OVERVIEW / CUSTOM RANGE
    |--------------------------------------------------------------------------
    */

    public function overview(Request $request): JsonResponse
    {
        [$start, $end] = $this->resolveRange($request);

        return response()->json([
            'data' => $this->buildReport($start, $end),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DAILY REPORT
    |--------------------------------------------------------------------------
    */

    public function daily(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $date = Carbon::parse(
            $validated['date'] ?? now()->toDateString()
        );

        return response()->json([
            'data' => $this->buildReport(
                $date->copy()->startOfDay(),
                $date->copy()->endOfDay(),
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY REPORT
    |--------------------------------------------------------------------------
    */

    public function monthly(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => [
                'nullable',
                'regex:/^\\d{4}-\\d{2}$/',
            ],
        ]);

        $month = Carbon::createFromFormat(
            'Y-m',
            $validated['month'] ?? now()->format('Y-m')
        );

        return response()->json([
            'data' => $this->buildReport(
                $month->copy()->startOfMonth()->startOfDay(),
                $month->copy()->endOfMonth()->endOfDay(),
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CSV EXPORT
    |--------------------------------------------------------------------------
    */

    public function export(Request $request): StreamedResponse
    {
        [$start, $end] = $this->resolveRange($request);

        $report = $this->buildReport($start, $end);

        $filename = sprintf(
            'mediva-report-%s-sd-%s.csv',
            $start->format('Y-m-d'),
            $end->format('Y-m-d'),
        );

        return response()->streamDownload(
            function () use ($report) {
                $handle = fopen('php://output', 'w');

                // BOM agar Excel membaca UTF-8 dengan benar.
                fwrite($handle, "\\xEF\\xBB\\xBF");

                fputcsv($handle, ['MEDIVA - LAPORAN MANAJEMEN'], ';');
                fputcsv($handle, ['Periode', $report['period']['start_date'] . ' s/d ' . $report['period']['end_date']], ';');
                fputcsv($handle, [], ';');

                fputcsv($handle, ['RINGKASAN MANAJEMEN'], ';');
                fputcsv($handle, ['Total Kunjungan', $report['management_metrics']['total_visits']], ';');
                fputcsv($handle, ['Kunjungan Selesai', $report['management_metrics']['completed_visits']], ';');
                fputcsv($handle, ['Kunjungan Dibatalkan', $report['management_metrics']['cancelled_visits']], ';');
                fputcsv($handle, ['Pasien Unik', $report['management_metrics']['unique_patients']], ';');
                fputcsv($handle, ['Completion Rate (%)', $report['management_metrics']['completion_rate']], ';');
                fputcsv($handle, ['Total Ditagihkan', $report['management_metrics']['total_invoiced']], ';');
                fputcsv($handle, ['Pendapatan Diterima', $report['management_metrics']['total_revenue']], ';');
                fputcsv($handle, ['Sisa Piutang', $report['management_metrics']['outstanding']], ';');
                fputcsv($handle, ['Resep Diserahkan', $report['management_metrics']['dispensed_prescriptions']], ';');
                fputcsv($handle, ['Obat Stok Minimum', $report['management_metrics']['low_stock_count']], ';');
                fputcsv($handle, [], ';');

                fputcsv($handle, ['STATISTIK KUNJUNGAN HARIAN'], ';');
                fputcsv($handle, ['Tanggal', 'Total', 'Selesai', 'Dibatalkan'], ';');

                foreach ($report['visit_statistics']['daily'] as $row) {
                    fputcsv($handle, [
                        $row['date'],
                        $row['total'],
                        $row['completed'],
                        $row['cancelled'],
                    ], ';');
                }

                fputcsv($handle, [], ';');
                fputcsv($handle, ['KUNJUNGAN PER UNIT'], ';');
                fputcsv($handle, ['Unit', 'Total'], ';');

                foreach ($report['visit_statistics']['by_unit'] as $row) {
                    fputcsv($handle, [$row['label'], $row['total']], ';');
                }

                fputcsv($handle, [], ';');
                fputcsv($handle, ['PENDAPATAN HARIAN'], ';');
                fputcsv($handle, ['Tanggal', 'Pendapatan'], ';');

                foreach ($report['revenue']['daily'] as $row) {
                    fputcsv($handle, [$row['date'], $row['total']], ';');
                }

                fputcsv($handle, [], ';');
                fputcsv($handle, ['PENDAPATAN PER METODE BAYAR'], ';');
                fputcsv($handle, ['Metode Bayar', 'Total'], ';');

                foreach ($report['revenue']['by_payment_method'] as $row) {
                    fputcsv($handle, [$row['label'], $row['total']], ';');
                }

                fputcsv($handle, [], ';');
                fputcsv($handle, ['STATISTIK FARMASI'], ';');
                fputcsv($handle, ['Resep Submitted', $report['pharmacy_statistics']['submitted']], ';');
                fputcsv($handle, ['Resep Processing', $report['pharmacy_statistics']['processing']], ';');
                fputcsv($handle, ['Resep Ready', $report['pharmacy_statistics']['ready']], ';');
                fputcsv($handle, ['Resep Dispensed', $report['pharmacy_statistics']['dispensed']], ';');
                fputcsv($handle, ['Resep Cancelled', $report['pharmacy_statistics']['cancelled']], ';');
                fputcsv($handle, ['Batch Hampir Expired', $report['pharmacy_statistics']['near_expiry_batches']], ';');
                fputcsv($handle, ['Batch Expired', $report['pharmacy_statistics']['expired_batches']], ';');
                fputcsv($handle, [], ';');

                fputcsv($handle, ['OBAT TERBANYAK DISERAHKAN'], ';');
                fputcsv($handle, ['Obat', 'Jumlah'], ';');

                foreach ($report['pharmacy_statistics']['top_dispensed_medicines'] as $row) {
                    fputcsv($handle, [$row['label'], $row['total']], ';');
                }

                fclose($handle);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ],
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BUILD COMPLETE REPORT
    |--------------------------------------------------------------------------
    */

    private function buildReport(Carbon $start, Carbon $end): array
    {
        $visitStatistics = $this->visitStatistics($start, $end);
        $revenue = $this->revenueStatistics($start, $end);
        $pharmacy = $this->pharmacyStatistics($start, $end);

        $totalVisits = $visitStatistics['summary']['total'];
        $completedVisits = $visitStatistics['summary']['completed'];
        $cancelledVisits = $visitStatistics['summary']['cancelled'];

        $uniquePatients = Visit::query()
            ->whereBetween('created_at', [$start, $end])
            ->distinct('patient_id')
            ->count('patient_id');

        $completionRate = $totalVisits > 0
            ? round(($completedVisits / $totalVisits) * 100, 2)
            : 0;

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'days' => $start->copy()->startOfDay()->diffInDays(
                    $end->copy()->startOfDay()
                ) + 1,
            ],

            'management_metrics' => [
                'total_visits' => $totalVisits,
                'completed_visits' => $completedVisits,
                'cancelled_visits' => $cancelledVisits,
                'unique_patients' => $uniquePatients,
                'completion_rate' => $completionRate,
                'total_invoiced' => $revenue['summary']['invoiced'],
                'total_revenue' => $revenue['summary']['received'],
                'outstanding' => $revenue['summary']['outstanding'],
                'average_revenue_per_visit' => $totalVisits > 0
                    ? round($revenue['summary']['received'] / $totalVisits, 2)
                    : 0,
                'dispensed_prescriptions' => $pharmacy['dispensed_in_period'],
                'low_stock_count' => $pharmacy['low_stock_count'],
            ],

            'visit_statistics' => $visitStatistics,
            'revenue' => $revenue,
            'pharmacy_statistics' => $pharmacy,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | VISIT STATISTICS
    |--------------------------------------------------------------------------
    */

    private function visitStatistics(Carbon $start, Carbon $end): array
    {
        $summaryRows = Visit::query()
            ->whereBetween('created_at', [$start, $end]);

        $summary = [
            'total' => (clone $summaryRows)->count(),
            'completed' => (clone $summaryRows)
                ->where('status', 'completed')
                ->count(),
            'cancelled' => (clone $summaryRows)
                ->where('status', 'cancelled')
                ->count(),
        ];

        $dailyRows = DB::table('visits')
            ->selectRaw("DATE(created_at) as report_date")
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            ->whereBetween('created_at', [$start, $end])
            ->groupByRaw('DATE(created_at)')
            ->orderBy('report_date')
            ->get()
            ->keyBy('report_date');

        $daily = [];

        foreach (CarbonPeriod::create(
            $start->copy()->startOfDay(),
            $end->copy()->startOfDay(),
        ) as $date) {
            $key = $date->format('Y-m-d');
            $row = $dailyRows->get($key);

            $daily[] = [
                'date' => $key,
                'total' => (int) ($row->total ?? 0),
                'completed' => (int) ($row->completed ?? 0),
                'cancelled' => (int) ($row->cancelled ?? 0),
            ];
        }

        $byUnit = DB::table('visits')
            ->leftJoin('units', 'units.id', '=', 'visits.unit_id')
            ->whereBetween('visits.created_at', [$start, $end])
            ->groupBy('visits.unit_id', 'units.name')
            ->orderByDesc(DB::raw('COUNT(*)'))
            ->selectRaw("COALESCE(units.name, 'Tanpa Unit') as label, COUNT(*) as total")
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $byType = DB::table('visits')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('visit_type')
            ->orderByDesc(DB::raw('COUNT(*)'))
            ->selectRaw("COALESCE(visit_type, 'unknown') as label, COUNT(*) as total")
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        return [
            'summary' => $summary,
            'daily' => $daily,
            'by_unit' => $byUnit,
            'by_visit_type' => $byType,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | REVENUE STATISTICS
    |--------------------------------------------------------------------------
    */

    private function revenueStatistics(Carbon $start, Carbon $end): array
    {
        $received = (float) Payment::query()
            ->where('status', 'posted')
            ->whereBetween('paid_at', [$start, $end])
            ->sum('amount');

        $invoiced = (float) Invoice::query()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('generated_at', [$start, $end])
            ->sum('grand_total');

        $outstanding = (float) Invoice::query()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('generated_at', [$start, $end])
            ->sum('balance_due');

        $postedPayments = Payment::query()
            ->where('status', 'posted')
            ->whereBetween('paid_at', [$start, $end]);

        $dailyRows = DB::table('payments')
            ->selectRaw('DATE(paid_at) as report_date, SUM(amount) as total')
            ->where('status', 'posted')
            ->whereBetween('paid_at', [$start, $end])
            ->groupByRaw('DATE(paid_at)')
            ->orderBy('report_date')
            ->get()
            ->keyBy('report_date');

        $daily = [];

        foreach (CarbonPeriod::create(
            $start->copy()->startOfDay(),
            $end->copy()->startOfDay(),
        ) as $date) {
            $key = $date->format('Y-m-d');

            $daily[] = [
                'date' => $key,
                'total' => (float) ($dailyRows->get($key)->total ?? 0),
            ];
        }

        $byPaymentMethod = DB::table('payments')
            ->leftJoin(
                'payment_methods',
                'payment_methods.id',
                '=',
                'payments.payment_method_id'
            )
            ->where('payments.status', 'posted')
            ->whereBetween('payments.paid_at', [$start, $end])
            ->groupBy('payments.payment_method_id', 'payment_methods.name')
            ->orderByDesc(DB::raw('SUM(payments.amount)'))
            ->selectRaw("COALESCE(payment_methods.name, 'Tidak Diketahui') as label, SUM(payments.amount) as total")
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'total' => (float) $row->total,
            ])
            ->values()
            ->all();

        $byCategory = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->where('invoices.status', '!=', 'cancelled')
            ->whereBetween('invoices.generated_at', [$start, $end])
            ->groupBy('invoice_items.category')
            ->orderByDesc(DB::raw('SUM(invoice_items.total)'))
            ->selectRaw('invoice_items.category as label, SUM(invoice_items.total) as total')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'total' => (float) $row->total,
            ])
            ->values()
            ->all();

        return [
            'summary' => [
                'invoiced' => $invoiced,
                'received' => $received,
                'outstanding' => $outstanding,
                'posted_payments' => (clone $postedPayments)->count(),
                'average_payment' => (clone $postedPayments)->count() > 0
                    ? round($received / (clone $postedPayments)->count(), 2)
                    : 0,
            ],
            'daily' => $daily,
            'by_payment_method' => $byPaymentMethod,
            'by_category' => $byCategory,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PHARMACY STATISTICS
    |--------------------------------------------------------------------------
    */

    private function pharmacyStatistics(Carbon $start, Carbon $end): array
    {
        $prescriptionBase = Prescription::query()
            ->whereBetween('submitted_at', [$start, $end]);

        $statusCounts = [];

        foreach ([
            'submitted',
            'processing',
            'ready',
            'dispensed',
            'cancelled',
        ] as $status) {
            $statusCounts[$status] = (clone $prescriptionBase)
                ->where('status', $status)
                ->count();
        }

        $dispensedInPeriod = Prescription::query()
            ->whereBetween('dispensed_at', [$start, $end])
            ->count();

        $movementSummary = DB::table('stock_movements')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("SUM(CASE WHEN movement_type = 'receive' THEN quantity_change ELSE 0 END) as received")
            ->selectRaw("SUM(CASE WHEN movement_type = 'dispense' THEN ABS(quantity_change) ELSE 0 END) as dispensed")
            ->selectRaw("SUM(CASE WHEN movement_type = 'opname' THEN 1 ELSE 0 END) as opname_count")
            ->first();

        $topDispensed = StockMovement::query()
            ->join('medicines', 'medicines.id', '=', 'stock_movements.medicine_id')
            ->where('stock_movements.movement_type', 'dispense')
            ->whereBetween('stock_movements.created_at', [$start, $end])
            ->groupBy('stock_movements.medicine_id', 'medicines.name')
            ->orderByDesc(DB::raw('SUM(ABS(stock_movements.quantity_change))'))
            ->limit(10)
            ->selectRaw('medicines.name as label, SUM(ABS(stock_movements.quantity_change)) as total')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'total' => $this->stockNumber($row->total),
            ])
            ->values()
            ->all();

        $medicines = Medicine::query()
            ->where('is_active', true)
            ->withSum([
                'batches as usable_stock' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->where('stock', '>', 0)
                        ->where(function ($query) {
                            $query
                                ->whereNull('expired_at')
                                ->orWhereDate('expired_at', '>=', today());
                        });
                },
            ], 'stock')
            ->get();

        $lowStock = $medicines
            ->filter(function ($medicine) {
                return (float) ($medicine->usable_stock ?? 0)
                    <= (float) ($medicine->minimum_stock ?? 0);
            })
            ->sortBy(fn ($medicine) => (float) ($medicine->usable_stock ?? 0))
            ->take(10)
            ->map(fn ($medicine) => [
                'id' => $medicine->id,
                'code' => $medicine->code,
                'name' => $medicine->name,
                'stock' => $this->stockNumber($medicine->usable_stock ?? 0),
                'minimum_stock' => $this->stockNumber($medicine->minimum_stock ?? 0),
                'unit' => $medicine->unit,
            ])
            ->values()
            ->all();

        $expiredBatches = MedicineBatch::query()
            ->whereNotNull('expired_at')
            ->whereDate('expired_at', '<', today())
            ->where('stock', '>', 0)
            ->count();

        $nearExpiryBatches = MedicineBatch::query()
            ->whereNotNull('expired_at')
            ->whereDate('expired_at', '>=', today())
            ->whereDate('expired_at', '<=', today()->copy()->addDays(90))
            ->where('stock', '>', 0)
            ->count();

        return [
            ...$statusCounts,
            'dispensed_in_period' => $dispensedInPeriod,
            'stock_received' => $this->stockNumber($movementSummary->received ?? 0),
            'stock_dispensed' => $this->stockNumber($movementSummary->dispensed ?? 0),
            'stock_opname_count' => (int) ($movementSummary->opname_count ?? 0),
            'low_stock_count' => count($lowStock),
            'low_stock_items' => $lowStock,
            'near_expiry_batches' => $nearExpiryBatches,
            'expired_batches' => $expiredBatches,
            'top_dispensed_medicines' => $topDispensed,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PERIOD
    |--------------------------------------------------------------------------
    */

    private function resolveRange(Request $request): array
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $start = Carbon::parse(
            $validated['start_date'] ?? now()->startOfMonth()->toDateString()
        )->startOfDay();

        $end = Carbon::parse(
            $validated['end_date'] ?? now()->toDateString()
        )->endOfDay();

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'end_date' => 'Tanggal akhir tidak boleh lebih kecil dari tanggal awal.',
            ]);
        }

        if ($start->diffInDays($end) > 366) {
            throw ValidationException::withMessages([
                'start_date' => 'Rentang laporan maksimal 366 hari.',
            ]);
        }

        return [$start, $end];
    }

    private function stockNumber(mixed $value): int|float
    {
        $number = (float) ($value ?? 0);

        return floor($number) == $number
            ? (int) $number
            : round($number, 2);
    }
}
