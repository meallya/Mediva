<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\MedicalRecord;
use App\Models\Payment;
use App\Models\Tariff;
use App\Models\Visit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BillingService
{
    /*
    |--------------------------------------------------------------------------
    | GENERATE / SYNC BILLING DARI KUNJUNGAN
    |--------------------------------------------------------------------------
    */

    public function generateForVisit(
        Visit $visit,
        int $userId,
    ): Invoice {
        return DB::transaction(function () use ($visit, $userId) {
            $visit = Visit::query()
                ->with([
                    'patient',
                    'unit',
                    'doctor.employee',
                ])
                ->lockForUpdate()
                ->findOrFail($visit->id);

            if ($visit->status !== 'completed') {
                throw ValidationException::withMessages([
                    'visit' => 'Billing hanya dapat dibuat dari kunjungan yang sudah selesai.',
                ]);
            }

            $invoice = Invoice::query()
                ->where('visit_id', $visit->id)
                ->lockForUpdate()
                ->first();

            if ($invoice?->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'invoice' => 'Invoice yang sudah dibatalkan tidak dapat disinkronkan kembali.',
                ]);
            }

            if ($invoice && $this->hasPostedPayment($invoice)) {
                throw ValidationException::withMessages([
                    'invoice' => 'Invoice sudah memiliki pembayaran. Void pembayaran terlebih dahulu sebelum sinkronisasi tagihan.',
                ]);
            }

            if (!$invoice) {
                $invoice = Invoice::create([
                    'invoice_number' => $this->newInvoiceNumber(),
                    'visit_id' => $visit->id,
                    'patient_id' => $visit->patient_id,
                    'status' => 'unpaid',
                    'subtotal' => 0,
                    'discount' => 0,
                    'grand_total' => 0,
                    'paid_amount' => 0,
                    'balance_due' => 0,
                    'generated_at' => now(),
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            } else {
                $invoice->update([
                    'patient_id' => $visit->patient_id,
                    'generated_at' => now(),
                    'updated_by' => $userId,
                ]);
            }

            /*
            |------------------------------------------------------------------
            | HAPUS ITEM AUTO LAMA
            |------------------------------------------------------------------
            |
            | Item manual Other Service tetap dipertahankan.
            |
            */

            $invoice->items()
                ->where('is_manual', false)
                ->delete();

            $this->addRegistrationCharge($invoice, $visit, $userId);
            $this->addDoctorServiceCharge($invoice, $visit, $userId);
            $this->addProcedureCharges($invoice, $visit, $userId);
            $this->addMedicineCharges($invoice, $visit, $userId);
            $this->addLaboratoryCharges($invoice, $visit, $userId);

            $this->recalculate($invoice, $userId);

            return $this->loadInvoice($invoice);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MANUAL OTHER SERVICE CRUD
    |--------------------------------------------------------------------------
    */

    public function addManualItem(
        Invoice $invoice,
        array $data,
        int $userId,
    ): InvoiceItem {
        return DB::transaction(function () use ($invoice, $data, $userId) {
            $invoice = $this->lockMutableInvoice($invoice->id);

            $quantity = (float) $data['quantity'];
            $unitPrice = (float) $data['unit_price'];

            $item = $invoice->items()->create([
                'category' => 'other_service',
                'source_type' => 'manual',
                'source_id' => null,
                'code' => $data['code'] ?? null,
                'description' => $data['description'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total' => round($quantity * $unitPrice, 2),
                'is_manual' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->recalculate($invoice, $userId);

            return $item->fresh();
        });
    }

    public function updateManualItem(
        Invoice $invoice,
        InvoiceItem $item,
        array $data,
        int $userId,
    ): InvoiceItem {
        return DB::transaction(function () use ($invoice, $item, $data, $userId) {
            $invoice = $this->lockMutableInvoice($invoice->id);

            $item = InvoiceItem::query()
                ->where('invoice_id', $invoice->id)
                ->whereKey($item->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$item->is_manual) {
                throw ValidationException::withMessages([
                    'item' => 'Item otomatis tidak dapat diedit manual. Gunakan Sinkronkan Tagihan.',
                ]);
            }

            $quantity = (float) $data['quantity'];
            $unitPrice = (float) $data['unit_price'];

            $item->update([
                'code' => $data['code'] ?? null,
                'description' => $data['description'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total' => round($quantity * $unitPrice, 2),
                'updated_by' => $userId,
            ]);

            $this->recalculate($invoice, $userId);

            return $item->fresh();
        });
    }

    public function deleteManualItem(
        Invoice $invoice,
        InvoiceItem $item,
        int $userId,
    ): void {
        DB::transaction(function () use ($invoice, $item, $userId) {
            $invoice = $this->lockMutableInvoice($invoice->id);

            $item = InvoiceItem::query()
                ->where('invoice_id', $invoice->id)
                ->whereKey($item->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$item->is_manual) {
                throw ValidationException::withMessages([
                    'item' => 'Item otomatis tidak dapat dihapus manual. Gunakan Sinkronkan Tagihan.',
                ]);
            }

            $item->delete();

            $this->recalculate($invoice, $userId);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    public function recordPayment(
        Invoice $invoice,
        array $data,
        int $userId,
    ): Payment {
        return DB::transaction(function () use ($invoice, $data, $userId) {
            $invoice = Invoice::query()
                ->lockForUpdate()
                ->findOrFail($invoice->id);

            if ($invoice->status === 'cancelled') {
                throw ValidationException::withMessages([
                    'invoice' => 'Invoice yang dibatalkan tidak dapat dibayar.',
                ]);
            }

            $this->recalculate($invoice, $userId);
            $invoice->refresh();

            if ($invoice->status === 'paid') {
                throw ValidationException::withMessages([
                    'invoice' => 'Invoice sudah lunas.',
                ]);
            }

            $amount = round((float) $data['amount'], 2);
            $balance = round((float) $invoice->balance_due, 2);

            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Jumlah pembayaran harus lebih dari 0.',
                ]);
            }

            if ($amount > $balance) {
                throw ValidationException::withMessages([
                    'amount' => 'Jumlah pembayaran tidak boleh melebihi sisa tagihan.',
                ]);
            }

            $payment = Payment::create([
                'payment_number' => $this->newPaymentNumber(),
                'invoice_id' => $invoice->id,
                'payment_method_id' => $data['payment_method_id'],
                'amount' => $amount,
                'paid_at' => $data['paid_at'] ?? now(),
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => 'posted',
                'created_by' => $userId,
            ]);

            $this->recalculate($invoice, $userId);

            return $payment->fresh();
        });
    }

    public function voidPayment(
        Payment $payment,
        string $reason,
        int $userId,
    ): Payment {
        return DB::transaction(function () use ($payment, $reason, $userId) {
            $payment = Payment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            if ($payment->status === 'void') {
                throw ValidationException::withMessages([
                    'payment' => 'Pembayaran ini sudah di-void.',
                ]);
            }

            $invoice = Invoice::query()
                ->lockForUpdate()
                ->findOrFail($payment->invoice_id);

            $payment->update([
                'status' => 'void',
                'voided_at' => now(),
                'voided_by' => $userId,
                'void_reason' => $reason,
            ]);

            $this->recalculate($invoice, $userId);

            return $payment->fresh();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL INVOICE
    |--------------------------------------------------------------------------
    */

    public function cancelInvoice(
        Invoice $invoice,
        string $reason,
        int $userId,
    ): Invoice {
        return DB::transaction(function () use ($invoice, $reason, $userId) {
            $invoice = Invoice::query()
                ->lockForUpdate()
                ->findOrFail($invoice->id);

            if ($invoice->status === 'cancelled') {
                return $this->loadInvoice($invoice);
            }

            if ($this->hasPostedPayment($invoice)) {
                throw ValidationException::withMessages([
                    'invoice' => 'Invoice memiliki pembayaran aktif. Void pembayaran terlebih dahulu sebelum membatalkan invoice.',
                ]);
            }

            $invoice->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
                'updated_by' => $userId,
            ]);

            return $this->loadInvoice($invoice);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RECALCULATE
    |--------------------------------------------------------------------------
    */

    public function recalculate(
        Invoice $invoice,
        ?int $userId = null,
    ): Invoice {
        $invoice->refresh();

        if ($invoice->status === 'cancelled') {
            return $invoice;
        }

        $subtotal = round((float) $invoice->items()->sum('total'), 2);
        $discount = max(0, round((float) $invoice->discount, 2));
        $grandTotal = max(0, round($subtotal - $discount, 2));

        $paidAmount = round((float) $invoice->payments()
            ->where('status', 'posted')
            ->sum('amount'), 2);

        $balanceDue = max(0, round($grandTotal - $paidAmount, 2));

        if ($grandTotal > 0 && $paidAmount >= $grandTotal) {
            $status = 'paid';
        } elseif ($paidAmount > 0) {
            $status = 'partial';
        } else {
            $status = 'unpaid';
        }

        $invoice->update([
            'subtotal' => $subtotal,
            'grand_total' => $grandTotal,
            'paid_amount' => $paidAmount,
            'balance_due' => $balanceDue,
            'status' => $status,
            'updated_by' => $userId ?? $invoice->updated_by,
        ]);

        return $invoice->refresh();
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO CHARGE: REGISTRATION
    |--------------------------------------------------------------------------
    */

    private function addRegistrationCharge(
        Invoice $invoice,
        Visit $visit,
        int $userId,
    ): void {
        $tariff = $this->matchTariff(
            category: 'registration',
            unitId: $visit->unit_id,
        );

        if (!$tariff) {
            return;
        }

        $this->createAutoItem(
            invoice: $invoice,
            tariff: $tariff,
            category: 'registration',
            sourceType: 'visit',
            sourceId: $visit->id,
            code: $tariff->code,
            description: $tariff->name,
            quantity: 1,
            unitPrice: (float) $tariff->amount,
            userId: $userId,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO CHARGE: DOCTOR SERVICE
    |--------------------------------------------------------------------------
    */

    private function addDoctorServiceCharge(
        Invoice $invoice,
        Visit $visit,
        int $userId,
    ): void {
        if (!$visit->doctor_id) {
            return;
        }

        $tariff = $this->matchTariff(
            category: 'doctor_service',
            unitId: $visit->unit_id,
            doctorId: $visit->doctor_id,
        );

        if (!$tariff) {
            return;
        }

        $doctorName = $visit->doctor?->employee?->name;

        $this->createAutoItem(
            invoice: $invoice,
            tariff: $tariff,
            category: 'doctor_service',
            sourceType: 'doctor',
            sourceId: $visit->doctor_id,
            code: $tariff->code,
            description: $doctorName
                ? "{$tariff->name} - {$doctorName}"
                : $tariff->name,
            quantity: 1,
            unitPrice: (float) $tariff->amount,
            userId: $userId,
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO CHARGE: PROCEDURE
    |--------------------------------------------------------------------------
    */

    private function addProcedureCharges(
        Invoice $invoice,
        Visit $visit,
        int $userId,
    ): void {
        $record = MedicalRecord::query()
            ->where('visit_id', $visit->id)
            ->latest('finalized_at')
            ->first();

        $procedures = data_get(
            $record?->coding_snapshot ?? [],
            'procedures',
            [],
        );

        if (!is_array($procedures)) {
            return;
        }

        foreach ($procedures as $procedure) {
            $code = $this->extractProcedureCode($procedure);

            if (!$code) {
                continue;
            }

            $tariff = $this->matchTariff(
                category: 'procedure',
                unitId: $visit->unit_id,
                referenceCode: $code,
            );

            if (!$tariff) {
                continue;
            }

            $description = $this->extractProcedureDescription($procedure)
                ?: $tariff->name;

            $sourceId = is_array($procedure)
                ? ($procedure['id'] ?? null)
                : null;

            $this->createAutoItem(
                invoice: $invoice,
                tariff: $tariff,
                category: 'procedure',
                sourceType: 'medical_record_procedure',
                sourceId: $sourceId,
                code: $code,
                description: $description,
                quantity: 1,
                unitPrice: (float) $tariff->amount,
                userId: $userId,
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO CHARGE: MEDICINE
    |--------------------------------------------------------------------------
    |
    | Harga obat diambil dari snapshot unit_price saat dispense bila tersedia.
    | Jika belum ada, fallback ke selling_price medicine batch.
    |
    */

    private function addMedicineCharges(
        Invoice $invoice,
        Visit $visit,
        int $userId,
    ): void {
        if (
            !Schema::hasTable('prescriptions') ||
            !Schema::hasTable('prescription_items') ||
            !Schema::hasTable('prescription_dispense_items') ||
            !Schema::hasTable('medicines')
        ) {
            return;
        }

        $query = DB::table('prescription_dispense_items as pdi')
            ->join(
                'prescription_items as pi',
                'pi.id',
                '=',
                'pdi.prescription_item_id',
            )
            ->join(
                'prescriptions as p',
                'p.id',
                '=',
                'pi.prescription_id',
            )
            ->join(
                'medicines as m',
                'm.id',
                '=',
                'pi.medicine_id',
            )
            ->where('p.visit_id', $visit->id)
            ->where('p.status', 'dispensed')
            ->select([
                'pdi.id',
                'pdi.quantity',
                'pi.medicine_id',
                'm.code',
                'm.name',
            ]);

        $hasDispenseUnitPrice = Schema::hasColumn(
            'prescription_dispense_items',
            'unit_price',
        );

        if ($hasDispenseUnitPrice) {
            $query->addSelect('pdi.unit_price');
        }

        $hasBatch = Schema::hasTable('medicine_batches')
            && Schema::hasColumn(
                'prescription_dispense_items',
                'medicine_batch_id',
            );

        $hasBatchSellingPrice = $hasBatch
            && Schema::hasColumn('medicine_batches', 'selling_price');

        if ($hasBatch) {
            $query->leftJoin(
                'medicine_batches as mb',
                'mb.id',
                '=',
                'pdi.medicine_batch_id',
            );

            $query->addSelect('pdi.medicine_batch_id');

            if ($hasBatchSellingPrice) {
                $query->addSelect('mb.selling_price');
            }
        }

        $hasMedicineSellingPrice = Schema::hasColumn(
            'medicines',
            'selling_price',
        );

        if ($hasMedicineSellingPrice) {
            $query->addSelect('m.selling_price as medicine_selling_price');
        }

        $rows = $query->get();

        foreach ($rows as $row) {
            $unitPrice = 0;

            if ($hasDispenseUnitPrice && isset($row->unit_price)) {
                $unitPrice = (float) $row->unit_price;
            }

            if (
                $unitPrice <= 0 &&
                $hasBatchSellingPrice &&
                isset($row->selling_price)
            ) {
                $unitPrice = (float) $row->selling_price;
            }

            if (
                $unitPrice <= 0 &&
                $hasMedicineSellingPrice &&
                isset($row->medicine_selling_price)
            ) {
                $unitPrice = (float) $row->medicine_selling_price;
            }

            if ($unitPrice <= 0) {
                throw ValidationException::withMessages([
                    'medicine_price' =>
                        "Harga jual obat {$row->name} belum tersedia. Isi selling price pada batch obat sebelum membuat billing.",
                ]);
            }

            $quantity = (float) $row->quantity;

            $this->createAutoItem(
                invoice: $invoice,
                tariff: null,
                category: 'medicine',
                sourceType: 'prescription_dispense_item',
                sourceId: $row->id,
                code: $row->code,
                description: $row->name,
                quantity: $quantity,
                unitPrice: $unitPrice,
                userId: $userId,
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO CHARGE: LABORATORY
    |--------------------------------------------------------------------------
    */

    private function addLaboratoryCharges(
        Invoice $invoice,
        Visit $visit,
        int $userId,
    ): void {
        if (
            !Schema::hasTable('laboratory_orders') ||
            !Schema::hasTable('laboratory_order_items') ||
            !Schema::hasTable('laboratory_test_types')
        ) {
            return;
        }

        $rows = DB::table('laboratory_order_items as loi')
            ->join(
                'laboratory_orders as lo',
                'lo.id',
                '=',
                'loi.laboratory_order_id',
            )
            ->join(
                'laboratory_test_types as ltt',
                'ltt.id',
                '=',
                'loi.test_type_id',
            )
            ->where('lo.visit_id', $visit->id)
            ->where('lo.status', 'completed')
            ->where('loi.status', 'completed')
            ->select([
                'loi.id',
                'loi.price',
                'ltt.code',
                'ltt.name',
            ])
            ->get();

        foreach ($rows as $row) {
            $this->createAutoItem(
                invoice: $invoice,
                tariff: null,
                category: 'laboratory',
                sourceType: 'laboratory_order_item',
                sourceId: $row->id,
                code: $row->code,
                description: $row->name,
                quantity: 1,
                unitPrice: (float) $row->price,
                userId: $userId,
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TARIFF MATCHING
    |--------------------------------------------------------------------------
    */

    private function matchTariff(
        string $category,
        ?int $unitId = null,
        ?int $doctorId = null,
        ?string $referenceCode = null,
    ): ?Tariff {
        $query = Tariff::query()
            ->where('category', $category)
            ->where('is_active', true);

        if ($referenceCode !== null) {
            $query->where('reference_code', $referenceCode);
        }

        $candidates = $query
            ->where(function ($query) use ($unitId) {
                $query->whereNull('unit_id');

                if ($unitId) {
                    $query->orWhere('unit_id', $unitId);
                }
            })
            ->where(function ($query) use ($doctorId) {
                $query->whereNull('doctor_id');

                if ($doctorId) {
                    $query->orWhere('doctor_id', $doctorId);
                }
            })
            ->get();

        return $candidates
            ->sortBy(function (Tariff $tariff) use ($unitId, $doctorId) {
                $score = 100;

                if ($doctorId && $tariff->doctor_id === $doctorId) {
                    $score -= 50;
                }

                if ($unitId && $tariff->unit_id === $unitId) {
                    $score -= 25;
                }

                if ($tariff->doctor_id === null) {
                    $score += 5;
                }

                if ($tariff->unit_id === null) {
                    $score += 2;
                }

                return $score;
            })
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function createAutoItem(
        Invoice $invoice,
        ?Tariff $tariff,
        string $category,
        ?string $sourceType,
        ?int $sourceId,
        ?string $code,
        string $description,
        float $quantity,
        float $unitPrice,
        int $userId,
    ): InvoiceItem {
        return $invoice->items()->create([
            'tariff_id' => $tariff?->id,
            'category' => $category,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'code' => $code,
            'description' => $description,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total' => round($quantity * $unitPrice, 2),
            'is_manual' => false,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }

    private function lockMutableInvoice(int $invoiceId): Invoice
    {
        $invoice = Invoice::query()
            ->lockForUpdate()
            ->findOrFail($invoiceId);

        if ($invoice->status === 'cancelled') {
            throw ValidationException::withMessages([
                'invoice' => 'Invoice sudah dibatalkan.',
            ]);
        }

        if ($this->hasPostedPayment($invoice)) {
            throw ValidationException::withMessages([
                'invoice' => 'Item invoice tidak dapat diubah setelah ada pembayaran aktif.',
            ]);
        }

        return $invoice;
    }

    private function hasPostedPayment(Invoice $invoice): bool
    {
        return $invoice->payments()
            ->where('status', 'posted')
            ->exists();
    }

    private function loadInvoice(Invoice $invoice): Invoice
    {
        return $invoice->fresh([
            'patient',
            'visit.unit',
            'visit.doctor.employee',
            'items.tariff',
            'payments.paymentMethod',
            'payments.creator',
        ]);
    }

    private function newInvoiceNumber(): string
    {
        return sprintf(
            'INV-%s-%s-%s',
            now()->format('Ymd'),
            now()->format('His'),
            Str::upper(Str::random(4)),
        );
    }

    private function newPaymentNumber(): string
    {
        return sprintf(
            'PAY-%s-%s-%s',
            now()->format('Ymd'),
            now()->format('His'),
            Str::upper(Str::random(4)),
        );
    }

    private function extractProcedureCode(mixed $procedure): ?string
    {
        if (!is_array($procedure)) {
            return null;
        }

        $code = data_get($procedure, 'code.code')
            ?? data_get($procedure, 'icd9cm_code')
            ?? data_get($procedure, 'procedure_code');

        if (!$code) {
            $rawCode = $procedure['code'] ?? null;

            if (is_string($rawCode)) {
                $code = $rawCode;
            }
        }

        return $code ? trim((string) $code) : null;
    }

    private function extractProcedureDescription(mixed $procedure): ?string
    {
        if (!is_array($procedure)) {
            return null;
        }

        $description = data_get($procedure, 'code.description')
            ?? data_get($procedure, 'description')
            ?? data_get($procedure, 'name')
            ?? data_get($procedure, 'procedure_name');

        return $description
            ? trim((string) $description)
            : null;
    }
}
