<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\Supplier;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PharmacyInventoryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | STOCK
    |--------------------------------------------------------------------------
    */

    public function stocks(
        Request $request
    ): JsonResponse {
        $search =
            trim(
                (string) $request->query(
                    'search',
                    ''
                )
            );

        $medicines =
            Medicine::query()
                ->when(
                    $search !== '',
                    function ($query) use ($search) {
                        $query->where(
                            function ($subQuery) use ($search) {
                                $subQuery
                                    ->where(
                                        'code',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'generic_name',
                                        'like',
                                        "%{$search}%"
                                    );
                            }
                        );
                    }
                )
                ->withSum(
                    [
                        'batches as total_stock' =>
                            function ($query) {
                                $query->where(
                                    'is_active',
                                    true
                                );
                            },
                    ],
                    'stock'
                )
                ->withSum(
                    [
                        'batches as usable_stock' =>
                            function ($query) {
                                $query
                                    ->where(
                                        'is_active',
                                        true
                                    )
                                    ->where(
                                        function ($subQuery) {
                                            $subQuery
                                                ->whereNull(
                                                    'expired_at'
                                                )
                                                ->orWhereDate(
                                                    'expired_at',
                                                    '>=',
                                                    today()
                                                );
                                        }
                                    );
                            },
                    ],
                    'stock'
                )
                ->orderBy('name')
                ->paginate(
                    min(
                        (int) $request->query(
                            'per_page',
                            20
                        ),
                        100
                    )
                );

        $medicines
            ->getCollection()
            ->transform(
                function ($medicine) {
                    $usable =
                        (float) (
                            $medicine->usable_stock
                            ?? 0
                        );

                    $minimum =
                        (float) (
                            $medicine->minimum_stock
                            ?? 0
                        );

                    $medicine->is_low_stock =
                        $usable <= $minimum;

                    return $medicine;
                }
            );

        return response()->json(
            $medicines
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MINIMUM STOCK
    |--------------------------------------------------------------------------
    */

    public function updateMinimumStock(
        Request $request,
        Medicine $medicine
    ): JsonResponse {
        $data =
            $request->validate([
                'minimum_stock' => [
                    'required',
                    'numeric',
                    'gte:0',
                ],
            ]);

        $old =
            $medicine->minimum_stock;

        $medicine->update([
            'minimum_stock' =>
                $data['minimum_stock'],

            'updated_by' =>
                $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'stock.minimum.update',
            module: 'pharmacy',
            description:
                'Farmasi mengubah minimum stok obat.',
            oldValues: [
                'minimum_stock' => $old,
            ],
            newValues: [
                'medicine_id' =>
                    $medicine->id,

                'minimum_stock' =>
                    $medicine->minimum_stock,
            ],
        );

        return response()->json([
            'message' =>
                'Minimum stok berhasil diperbarui.',

            'data' =>
                $medicine->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BATCH LIST
    |--------------------------------------------------------------------------
    */

    public function batches(
        Request $request
    ): JsonResponse {
        $search =
            trim(
                (string) $request->query(
                    'search',
                    ''
                )
            );

        $status =
            $request->query(
                'status'
            );

        $batches =
            MedicineBatch::query()
                ->with([
                    'medicine',
                    'supplier',
                ])
                ->when(
                    $search !== '',
                    function ($query) use ($search) {
                        $query->where(
                            function ($subQuery) use ($search) {
                                $subQuery
                                    ->where(
                                        'batch_number',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhereHas(
                                        'medicine',
                                        function ($medicineQuery) use ($search) {
                                            $medicineQuery
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
                        );
                    }
                )
                ->when(
                    $status === 'expired',
                    fn ($query) =>
                        $query->whereDate(
                            'expired_at',
                            '<',
                            today()
                        )
                )
                ->when(
                    $status === 'near_expiry',
                    fn ($query) =>
                        $query
                            ->whereDate(
                                'expired_at',
                                '>=',
                                today()
                            )
                            ->whereDate(
                                'expired_at',
                                '<=',
                                today()
                                    ->copy()
                                    ->addDays(90)
                            )
                )
                ->orderByRaw(
                    'CASE WHEN expired_at IS NULL THEN 1 ELSE 0 END'
                )
                ->orderBy('expired_at')
                ->paginate(
                    min(
                        (int) $request->query(
                            'per_page',
                            20
                        ),
                        100
                    )
                );

        $batches
            ->getCollection()
            ->transform(
                function ($batch) {
                    $batch->is_expired =
                        $batch->expired_at
                        ? $batch->expired_at
                            ->isBefore(today())
                        : false;

                    $batch->days_to_expiry =
                        $batch->expired_at
                        ? today()->diffInDays(
                            $batch->expired_at,
                            false
                        )
                        : null;

                    return $batch;
                }
            );

        return response()->json(
            $batches
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE BATCH
    |--------------------------------------------------------------------------
    */

    public function storeBatch(
        Request $request
    ): JsonResponse {
        $data =
            $request->validate([
                'medicine_id' => [
                    'required',
                    'integer',
                    'exists:medicines,id',
                ],

                'supplier_id' => [
                    'nullable',
                    'integer',
                    'exists:suppliers,id',
                ],

                'batch_number' => [
                    'required',
                    'string',
                    'max:100',

                    Rule::unique(
                        'medicine_batches',
                        'batch_number'
                    )->where(
                        fn ($query) =>
                            $query->where(
                                'medicine_id',
                                $request->input(
                                    'medicine_id'
                                )
                            )
                    ),
                ],

                'expired_at' => [
                    'nullable',
                    'date',
                ],

                'initial_stock' => [
                    'required',
                    'numeric',
                    'gte:0',
                ],

                'purchase_price' => [
                    'nullable',
                    'numeric',
                    'gte:0',
                ],

                'selling_price' => [
                    'nullable',
                    'numeric',
                    'gte:0',
                ],

                'received_at' => [
                    'nullable',
                    'date',
                ],
            ]);

        $batch =
            DB::transaction(
                function () use (
                    $request,
                    $data
                ) {
                    $stock =
                        (float) $data[
                            'initial_stock'
                        ];

                    $batch =
                        MedicineBatch::create([
                            'medicine_id' =>
                                $data['medicine_id'],

                            'supplier_id' =>
                                $data['supplier_id']
                                ?? null,

                            'batch_number' =>
                                strtoupper(
                                    trim(
                                        $data[
                                            'batch_number'
                                        ]
                                    )
                                ),

                            'expired_at' =>
                                $data['expired_at']
                                ?? null,

                            'stock' =>
                                $stock,

                            'purchase_price' =>
                                $data['purchase_price']
                                ?? null,

                            'selling_price' =>
                                $data['selling_price']
                                ?? null,

                            'received_at' =>
                                $data['received_at']
                                ?? now()->toDateString(),

                            'is_active' =>
                                true,

                            'created_by' =>
                                $request->user()->id,

                            'updated_by' =>
                                $request->user()->id,
                        ]);

                    if ($stock > 0) {
                        StockMovement::create([
                            'medicine_id' =>
                                $batch->medicine_id,

                            'medicine_batch_id' =>
                                $batch->id,

                            'movement_type' =>
                                'receive',

                            'quantity_change' =>
                                $stock,

                            'stock_before' =>
                                0,

                            'stock_after' =>
                                $stock,

                            'reference_type' =>
                                'batch_receive',

                            'reference_id' =>
                                $batch->id,

                            'notes' =>
                                'Stok awal batch.',

                            'created_by' =>
                                $request->user()->id,
                        ]);
                    }

                    return $batch;
                }
            );

        AuditLogger::log(
            request: $request,
            action: 'medicine.batch.create',
            module: 'pharmacy',
            description:
                'Farmasi membuat batch obat.',
            newValues: [
                'batch_id' =>
                    $batch->id,

                'medicine_id' =>
                    $batch->medicine_id,

                'stock' =>
                    $batch->stock,
            ],
        );

        return response()->json([
            'message' =>
                'Batch obat berhasil dibuat.',

            'data' =>
                $batch->load([
                    'medicine',
                    'supplier',
                ]),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | RECEIVE STOCK
    |--------------------------------------------------------------------------
    */

    public function receiveBatch(
        Request $request,
        MedicineBatch $batch
    ): JsonResponse {
        $data =
            $request->validate([
                'quantity' => [
                    'required',
                    'numeric',
                    'gt:0',
                ],

                'notes' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],
            ]);

        DB::transaction(
            function () use (
                $request,
                $batch,
                $data
            ) {
                $locked =
                    MedicineBatch::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $batch->id
                        );

                $before =
                    (float) $locked->stock;

                $quantity =
                    (float) $data[
                        'quantity'
                    ];

                $after =
                    $before + $quantity;

                $locked->update([
                    'stock' =>
                        $after,

                    'updated_by' =>
                        $request->user()->id,
                ]);

                StockMovement::create([
                    'medicine_id' =>
                        $locked->medicine_id,

                    'medicine_batch_id' =>
                        $locked->id,

                    'movement_type' =>
                        'receive',

                    'quantity_change' =>
                        $quantity,

                    'stock_before' =>
                        $before,

                    'stock_after' =>
                        $after,

                    'reference_type' =>
                        'batch_receive',

                    'reference_id' =>
                        $locked->id,

                    'notes' =>
                        $data['notes']
                        ?? 'Penerimaan stok.',

                    'created_by' =>
                        $request->user()->id,
                ]);
            }
        );

        return response()->json([
            'message' =>
                'Stok berhasil ditambahkan.',

            'data' =>
                $batch->fresh([
                    'medicine',
                    'supplier',
                ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STOCK MOVEMENTS
    |--------------------------------------------------------------------------
    */

    public function movements(
        Request $request
    ): JsonResponse {
        $movements =
            StockMovement::query()
                ->with([
                    'medicine',
                    'batch',
                ])
                ->when(
                    $request->filled(
                        'medicine_id'
                    ),
                    fn ($query) =>
                        $query->where(
                            'medicine_id',
                            $request->query(
                                'medicine_id'
                            )
                        )
                )
                ->when(
                    $request->filled(
                        'movement_type'
                    ),
                    fn ($query) =>
                        $query->where(
                            'movement_type',
                            $request->query(
                                'movement_type'
                            )
                        )
                )
                ->latest('id')
                ->paginate(
                    min(
                        (int) $request->query(
                            'per_page',
                            30
                        ),
                        100
                    )
                );

        return response()->json(
            $movements
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SUPPLIERS
    |--------------------------------------------------------------------------
    */

    public function suppliers(
        Request $request
    ): JsonResponse {
        $search =
            trim(
                (string) $request->query(
                    'search',
                    ''
                )
            );

        $suppliers =
            Supplier::query()
                ->when(
                    $search !== '',
                    fn ($query) =>
                        $query->where(
                            function ($subQuery) use ($search) {
                                $subQuery
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
                        )
                )
                ->orderBy('name')
                ->paginate(
                    min(
                        (int) $request->query(
                            'per_page',
                            30
                        ),
                        100
                    )
                );

        return response()->json(
            $suppliers
        );
    }

    public function storeSupplier(
        Request $request
    ): JsonResponse {
        $data =
            $this->validateSupplier(
                $request
            );

        $data['code'] =
            strtoupper(
                trim(
                    $data['code']
                )
            );

        $data['created_by'] =
            $request->user()->id;

        $data['updated_by'] =
            $request->user()->id;

        $supplier =
            Supplier::create(
                $data
            );

        AuditLogger::log(
            request: $request,
            action: 'supplier.create',
            module: 'pharmacy',
            description:
                'Farmasi menambahkan supplier.',
            newValues: [
                'supplier_id' =>
                    $supplier->id,

                'code' =>
                    $supplier->code,

                'name' =>
                    $supplier->name,
            ],
        );

        return response()->json([
            'message' =>
                'Supplier berhasil ditambahkan.',

            'data' =>
                $supplier,
        ], 201);
    }

    public function updateSupplier(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $data =
            $this->validateSupplier(
                $request,
                $supplier
            );

        $data['code'] =
            strtoupper(
                trim(
                    $data['code']
                )
            );

        $data['updated_by'] =
            $request->user()->id;

        $supplier->update(
            $data
        );

        return response()->json([
            'message' =>
                'Supplier berhasil diperbarui.',

            'data' =>
                $supplier->fresh(),
        ]);
    }

    public function destroySupplier(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        if (
            $supplier
                ->batches()
                ->exists()
        ) {
            return response()->json([
                'message' =>
                    'Supplier sudah digunakan pada batch dan tidak dapat dihapus.',
            ], 422);
        }

        $supplier->delete();

        AuditLogger::log(
            request: $request,
            action: 'supplier.delete',
            module: 'pharmacy',
            description:
                'Farmasi menghapus supplier.',
            oldValues: [
                'supplier_id' =>
                    $supplier->id,

                'code' =>
                    $supplier->code,

                'name' =>
                    $supplier->name,
            ],
        );

        return response()->json([
            'message' =>
                'Supplier berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STOCK OPNAME
    |--------------------------------------------------------------------------
    */

    public function stockOpname(
        Request $request
    ): JsonResponse {
        $data =
            $request->validate([
                'notes' => [
                    'nullable',
                    'string',
                    'max:3000',
                ],

                'items' => [
                    'required',
                    'array',
                    'min:1',
                ],

                'items.*.batch_id' => [
                    'required',
                    'integer',
                    'distinct',
                    'exists:medicine_batches,id',
                ],

                'items.*.physical_stock' => [
                    'required',
                    'numeric',
                    'gte:0',
                ],
            ]);

        $opname =
            DB::transaction(
                function () use (
                    $request,
                    $data
                ) {
                    $opname =
                        StockOpname::create([
                            'opname_number' =>
                                'OPN-' .
                                now()->format(
                                    'YmdHis'
                                ) .
                                '-' .
                                strtoupper(
                                    Str::random(4)
                                ),

                            'status' =>
                                'completed',

                            'notes' =>
                                $data['notes']
                                ?? null,

                            'completed_at' =>
                                now(),

                            'created_by' =>
                                $request->user()->id,
                        ]);

                    foreach (
                        $data['items']
                        as $item
                    ) {
                        $batch =
                            MedicineBatch::query()
                                ->lockForUpdate()
                                ->findOrFail(
                                    $item[
                                        'batch_id'
                                    ]
                                );

                        $system =
                            (float) $batch->stock;

                        $physical =
                            (float) $item[
                                'physical_stock'
                            ];

                        $difference =
                            $physical - $system;

                        StockOpnameItem::create([
                            'stock_opname_id' =>
                                $opname->id,

                            'medicine_batch_id' =>
                                $batch->id,

                            'system_stock' =>
                                $system,

                            'physical_stock' =>
                                $physical,

                            'difference' =>
                                $difference,
                        ]);

                        $batch->update([
                            'stock' =>
                                $physical,

                            'updated_by' =>
                                $request->user()->id,
                        ]);

                        if (
                            abs(
                                $difference
                            ) > 0
                        ) {
                            StockMovement::create([
                                'medicine_id' =>
                                    $batch->medicine_id,

                                'medicine_batch_id' =>
                                    $batch->id,

                                'movement_type' =>
                                    'opname',

                                'quantity_change' =>
                                    $difference,

                                'stock_before' =>
                                    $system,

                                'stock_after' =>
                                    $physical,

                                'reference_type' =>
                                    'stock_opname',

                                'reference_id' =>
                                    $opname->id,

                                'notes' =>
                                    $data['notes']
                                    ?? 'Stock opname.',

                                'created_by' =>
                                    $request->user()->id,
                            ]);
                        }
                    }

                    return $opname;
                }
            );

        AuditLogger::log(
            request: $request,
            action: 'stock.opname',
            module: 'pharmacy',
            description:
                'Farmasi melakukan stock opname.',
            newValues: [
                'stock_opname_id' =>
                    $opname->id,

                'items_count' =>
                    count(
                        $data['items']
                    ),
            ],
        );

        return response()->json([
            'message' =>
                'Stock opname berhasil disimpan.',

            'data' =>
                $opname->load([
                    'items.batch.medicine',
                ]),
        ], 201);
    }

    private function validateSupplier(
        Request $request,
        ?Supplier $supplier = null
    ): array {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',

                Rule::unique(
                    'suppliers',
                    'code'
                )->ignore(
                    $supplier?->id
                ),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'contact_person' => [
                'nullable',
                'string',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'address' => [
                'nullable',
                'string',
                'max:3000',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],
        ]);
    }
}