<?php

namespace App\Services;

use App\Models\InventoryRequest;
use App\Models\InventoryStock;
use App\Models\InventoryStockMovement;
use App\Models\InventoryStockOpname;
use App\Models\InventoryStockOpnameItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GeneralInventoryStockService
{
    public function stockIn(
        int $itemId,
        int $warehouseId,
        float $quantity,
        int $userId,
        ?int $supplierId = null,
        ?string $notes = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
    ): InventoryStockMovement {
        return DB::transaction(function () use (
            $itemId,
            $warehouseId,
            $quantity,
            $userId,
            $supplierId,
            $notes,
            $referenceType,
            $referenceId,
        ) {
            $stock = $this->lockStock(
                $itemId,
                $warehouseId,
                $userId,
            );

            $before = (float) $stock->quantity;
            $after = $before + $quantity;

            $stock->update([
                'quantity' => $after,
                'updated_by' => $userId,
            ]);

            return InventoryStockMovement::create([
                'item_id' => $itemId,
                'warehouse_id' => $warehouseId,
                'movement_type' => 'stock_in',
                'quantity_change' => $quantity,
                'stock_before' => $before,
                'stock_after' => $after,
                'supplier_id' => $supplierId,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
                'created_by' => $userId,
            ]);
        });
    }

    public function stockOut(
        int $itemId,
        int $warehouseId,
        float $quantity,
        int $userId,
        ?int $destinationUnitId = null,
        ?string $notes = null,
    ): InventoryStockMovement {
        return DB::transaction(function () use (
            $itemId,
            $warehouseId,
            $quantity,
            $userId,
            $destinationUnitId,
            $notes,
        ) {
            $stock = $this->lockStock(
                $itemId,
                $warehouseId,
                $userId,
            );

            $before = (float) $stock->quantity;

            if ($before < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stok tidak mencukupi untuk transaksi barang keluar.',
                ]);
            }

            $after = $before - $quantity;

            $stock->update([
                'quantity' => $after,
                'updated_by' => $userId,
            ]);

            return InventoryStockMovement::create([
                'item_id' => $itemId,
                'warehouse_id' => $warehouseId,
                'movement_type' => 'stock_out',
                'quantity_change' => -$quantity,
                'stock_before' => $before,
                'stock_after' => $after,
                'destination_unit_id' => $destinationUnitId,
                'notes' => $notes,
                'created_by' => $userId,
            ]);
        });
    }

    public function distribute(
        InventoryRequest $inventoryRequest,
        int $userId,
    ): InventoryRequest {
        return DB::transaction(function () use (
            $inventoryRequest,
            $userId,
        ) {
            $request = InventoryRequest::query()
                ->with(['items.item'])
                ->lockForUpdate()
                ->findOrFail($inventoryRequest->id);

            if ($request->status !== 'approved') {
                throw ValidationException::withMessages([
                    'status' => 'Hanya permintaan berstatus approved yang dapat didistribusikan.',
                ]);
            }

            foreach ($request->items as $requestItem) {
                $quantity = (float) (
                    $requestItem->approved_quantity
                    ?? $requestItem->requested_quantity
                );

                if ($quantity <= 0) {
                    continue;
                }

                $stock = $this->lockStock(
                    $requestItem->item_id,
                    $request->warehouse_id,
                    $userId,
                );

                $before = (float) $stock->quantity;

                if ($before < $quantity) {
                    $itemName = $requestItem->item?->name ?? 'Barang';

                    throw ValidationException::withMessages([
                        'stock' => "Stok {$itemName} tidak mencukupi. Dibutuhkan {$quantity}, tersedia {$before}.",
                    ]);
                }

                $after = $before - $quantity;

                $stock->update([
                    'quantity' => $after,
                    'updated_by' => $userId,
                ]);

                $requestItem->update([
                    'distributed_quantity' => $quantity,
                ]);

                InventoryStockMovement::create([
                    'item_id' => $requestItem->item_id,
                    'warehouse_id' => $request->warehouse_id,
                    'movement_type' => 'distribution',
                    'quantity_change' => -$quantity,
                    'stock_before' => $before,
                    'stock_after' => $after,
                    'destination_unit_id' => $request->unit_id,
                    'reference_type' => 'inventory_request',
                    'reference_id' => $request->id,
                    'notes' => "Distribusi {$request->request_number}",
                    'created_by' => $userId,
                ]);
            }

            $request->update([
                'status' => 'distributed',
                'distributed_by' => $userId,
                'distributed_at' => now(),
            ]);

            return $request->fresh([
                'unit',
                'warehouse',
                'items.item.uom',
                'requestedBy',
                'approvedBy',
                'distributedBy',
            ]);
        });
    }

    public function opname(
        int $warehouseId,
        array $items,
        int $userId,
        ?string $notes = null,
    ): InventoryStockOpname {
        return DB::transaction(function () use (
            $warehouseId,
            $items,
            $userId,
            $notes,
        ) {
            $opname = InventoryStockOpname::create([
                'opname_number' => $this->generateNumber('OPN'),
                'warehouse_id' => $warehouseId,
                'status' => 'completed',
                'notes' => $notes,
                'completed_at' => now(),
                'created_by' => $userId,
            ]);

            foreach ($items as $item) {
                $itemId = (int) $item['item_id'];
                $physicalStock = (float) $item['physical_stock'];

                $stock = $this->lockStock(
                    $itemId,
                    $warehouseId,
                    $userId,
                );

                $systemStock = (float) $stock->quantity;
                $difference = $physicalStock - $systemStock;

                InventoryStockOpnameItem::create([
                    'inventory_stock_opname_id' => $opname->id,
                    'item_id' => $itemId,
                    'system_stock' => $systemStock,
                    'physical_stock' => $physicalStock,
                    'difference' => $difference,
                ]);

                if ($difference != 0.0) {
                    $stock->update([
                        'quantity' => $physicalStock,
                        'updated_by' => $userId,
                    ]);

                    InventoryStockMovement::create([
                        'item_id' => $itemId,
                        'warehouse_id' => $warehouseId,
                        'movement_type' => 'opname',
                        'quantity_change' => $difference,
                        'stock_before' => $systemStock,
                        'stock_after' => $physicalStock,
                        'reference_type' => 'inventory_stock_opname',
                        'reference_id' => $opname->id,
                        'notes' => "Stock opname {$opname->opname_number}",
                        'created_by' => $userId,
                    ]);
                }
            }

            return $opname->fresh([
                'warehouse',
                'items.item.uom',
            ]);
        });
    }

    private function lockStock(
        int $itemId,
        int $warehouseId,
        int $userId,
    ): InventoryStock {
        InventoryStock::query()->firstOrCreate(
            [
                'item_id' => $itemId,
                'warehouse_id' => $warehouseId,
            ],
            [
                'quantity' => 0,
                'updated_by' => $userId,
            ]
        );

        return InventoryStock::query()
            ->where('item_id', $itemId)
            ->where('warehouse_id', $warehouseId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function generateNumber(string $prefix): string
    {
        return sprintf(
            'INV-%s-%s-%s',
            $prefix,
            now()->format('YmdHis'),
            strtoupper(bin2hex(random_bytes(2))),
        );
    }
}
