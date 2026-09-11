<?php

namespace App\Services;

use App\Models\MedicineBatch;
use App\Models\Prescription;
use App\Models\PrescriptionDispenseItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class PharmacyStockService
{
    public function dispense(
        Prescription $prescription,
        int $userId
    ): array {
        return DB::transaction(
            function () use (
                $prescription,
                $userId
            ) {
                $lockedPrescription =
                    Prescription::query()
                        ->with([
                            'items.medicine',
                        ])
                        ->lockForUpdate()
                        ->findOrFail(
                            $prescription->id
                        );

                if (
                    $lockedPrescription->status !==
                    'ready'
                ) {
                    abort(
                        422,
                        'Hanya resep berstatus Ready yang dapat diserahkan.'
                    );
                }

                if (
                    !$lockedPrescription->verified_at
                ) {
                    abort(
                        422,
                        'Resep belum diverifikasi.'
                    );
                }

                $allocations = [];

                foreach (
                    $lockedPrescription->items
                    as $item
                ) {
                    $remaining =
                        (float) $item->quantity;

                    $batches =
                        MedicineBatch::query()
                            ->where(
                                'medicine_id',
                                $item->medicine_id
                            )
                            ->where(
                                'is_active',
                                true
                            )
                            ->where(
                                'stock',
                                '>',
                                0
                            )
                            ->where(
                                function ($query) {
                                    $query
                                        ->whereNull(
                                            'expired_at'
                                        )
                                        ->orWhereDate(
                                            'expired_at',
                                            '>=',
                                            today()
                                        );
                                }
                            )
                            /*
                             * FEFO:
                             * yang expired paling dekat dipakai dulu.
                             */
                            ->orderByRaw(
                                'CASE WHEN expired_at IS NULL THEN 1 ELSE 0 END'
                            )
                            ->orderBy(
                                'expired_at'
                            )
                            ->orderBy('id')
                            ->lockForUpdate()
                            ->get();

                    $available =
                        (float) $batches->sum(
                            'stock'
                        );

                    if (
                        $available <
                        $remaining
                    ) {
                        abort(
                            422,
                            "Stok {$item->medicine->name} tidak mencukupi. Dibutuhkan {$remaining}, tersedia {$available}."
                        );
                    }

                    foreach (
                        $batches
                        as $batch
                    ) {
                        if (
                            $remaining <= 0
                        ) {
                            break;
                        }

                        $before =
                            (float) $batch->stock;

                        $used =
                            min(
                                $remaining,
                                $before
                            );

                        $after =
                            $before - $used;

                        $batch->update([
                            'stock' =>
                                $after,

                            'updated_by' =>
                                $userId,
                        ]);

                        PrescriptionDispenseItem::create([
                            'prescription_id' =>
                                $lockedPrescription->id,

                            'prescription_item_id' =>
                                $item->id,

                            'medicine_batch_id' =>
                                $batch->id,

                            'quantity' =>
                                $used,

                            'created_by' =>
                                $userId,
                        ]);

                        StockMovement::create([
                            'medicine_id' =>
                                $item->medicine_id,

                            'medicine_batch_id' =>
                                $batch->id,

                            'movement_type' =>
                                'dispense',

                            'quantity_change' =>
                                -$used,

                            'stock_before' =>
                                $before,

                            'stock_after' =>
                                $after,

                            'reference_type' =>
                                'prescription',

                            'reference_id' =>
                                $lockedPrescription->id,

                            'notes' =>
                                "Dispense {$lockedPrescription->prescription_number}",

                            'created_by' =>
                                $userId,
                        ]);

                        $allocations[] = [
                            'prescription_item_id' =>
                                $item->id,

                            'medicine_id' =>
                                $item->medicine_id,

                            'batch_id' =>
                                $batch->id,

                            'batch_number' =>
                                $batch->batch_number,

                            'quantity' =>
                                $used,
                        ];

                        $remaining -= $used;
                    }
                }

                $lockedPrescription->update([
                    'status' =>
                        'dispensed',

                    'dispensed_at' =>
                        now(),

                    'updated_by' =>
                        $userId,
                ]);

                return $allocations;
            }
        );
    }
}