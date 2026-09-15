<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryRequest;
use App\Models\InventoryRequestItem;
use App\Models\InventoryStock;
use App\Models\InventoryStockMovement;
use App\Models\InventoryUom;
use App\Models\InventoryWarehouse;
use App\Models\Supplier;
use App\Models\Unit;
use App\Services\AuditLogger;
use App\Services\GeneralInventoryStockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class GeneralInventoryController extends Controller
{
    public function __construct(
        private readonly GeneralInventoryStockService $stockService,
    ) {
    }

    public function dashboard(): JsonResponse
    {
        $activeItems = InventoryItem::query()
            ->where('is_active', true)
            ->count();

        $activeWarehouses = InventoryWarehouse::query()
            ->where('is_active', true)
            ->count();

        $pendingRequests = InventoryRequest::query()
            ->where('status', 'submitted')
            ->count();

        $lowStockCount = InventoryItem::query()
            ->where('is_active', true)
            ->withSum('stocks as total_stock', 'quantity')
            ->get()
            ->filter(function (InventoryItem $item) {
                $minimumStock = (float) $item->minimum_stock;

                return $minimumStock > 0
                    && (float) ($item->total_stock ?? 0) <= $minimumStock;
            })
            ->count();

        $recentMovements = InventoryStockMovement::query()
            ->with([
                'item:id,code,name,uom_id',
                'item.uom:id,name,symbol',
                'warehouse:id,code,name',
                'destinationUnit:id,code,name',
            ])
            ->latest('id')
            ->limit(8)
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'active_items' => $activeItems,
                    'active_warehouses' => $activeWarehouses,
                    'low_stock_count' => $lowStockCount,
                    'pending_requests' => $pendingRequests,
                ],
                'recent_movements' => $recentMovements,
            ],
        ]);
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'data' => [
                'categories' => InventoryCategory::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name']),

                'uoms' => InventoryUom::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'symbol']),

                'warehouses' => InventoryWarehouse::query()
                    ->with('unit:id,code,name')
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'unit_id', 'location']),

                'suppliers' => Supplier::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name']),

                'units' => Unit::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'type']),

                'items' => InventoryItem::query()
                    ->with('uom:id,name,symbol')
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'uom_id', 'minimum_stock']),
            ],
        ]);
    }

    public function items(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');
        $categoryId = $request->query('category_id');
        $perPage = min(max((int) $request->query('per_page', 10), 5), 100);

        $query = InventoryItem::query()
            ->with([
                'category:id,code,name',
                'uom:id,code,name,symbol',
                'defaultSupplier:id,code,name',
            ])
            ->withSum('stocks as total_stock', 'quantity');

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return response()->json(
            $query
                ->orderBy('name')
                ->paginate($perPage)
                ->withQueryString()
        );
    }

    public function storeItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:100', 'unique:inventory_items,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['nullable', 'integer', 'exists:inventory_categories,id'],
            'uom_id' => ['required', 'integer', 'exists:inventory_uoms,id'],
            'default_supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['description'] = isset($data['description'])
            ? trim($data['description'])
            : null;
        $data['minimum_stock'] = $data['minimum_stock'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $item = InventoryItem::create($data)->load([
            'category:id,code,name',
            'uom:id,code,name,symbol',
            'defaultSupplier:id,code,name',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.item.create',
            module: 'inventory',
            description: "Tambah barang inventaris {$item->code} - {$item->name}",
            newValues: $item->toArray(),
        );

        return response()->json([
            'message' => 'Barang inventaris berhasil ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function updateItem(
        Request $request,
        InventoryItem $inventoryItem,
    ): JsonResponse {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'code')->ignore($inventoryItem->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['nullable', 'integer', 'exists:inventory_categories,id'],
            'uom_id' => ['required', 'integer', 'exists:inventory_uoms,id'],
            'default_supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $oldValues = $inventoryItem->toArray();

        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['description'] = isset($data['description'])
            ? trim($data['description'])
            : null;
        $data['minimum_stock'] = $data['minimum_stock'] ?? 0;
        $data['updated_by'] = $request->user()->id;

        $inventoryItem->update($data);
        $inventoryItem->refresh()->load([
            'category:id,code,name',
            'uom:id,code,name,symbol',
            'defaultSupplier:id,code,name',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.item.update',
            module: 'inventory',
            description: "Ubah barang inventaris {$inventoryItem->code} - {$inventoryItem->name}",
            oldValues: $oldValues,
            newValues: $inventoryItem->toArray(),
        );

        return response()->json([
            'message' => 'Barang inventaris berhasil diperbarui.',
            'data' => $inventoryItem,
        ]);
    }

    public function toggleItemStatus(
        Request $request,
        InventoryItem $inventoryItem,
    ): JsonResponse {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $oldValues = [
            'is_active' => $inventoryItem->is_active,
        ];

        $inventoryItem->update([
            'is_active' => $data['is_active'],
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.item.status',
            module: 'inventory',
            description: "Ubah status barang inventaris {$inventoryItem->code}",
            oldValues: $oldValues,
            newValues: [
                'is_active' => $inventoryItem->is_active,
            ],
        );

        return response()->json([
            'message' => 'Status barang berhasil diperbarui.',
            'data' => $inventoryItem,
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => InventoryCategory::query()
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:100', 'unique:inventory_categories,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $category = InventoryCategory::create($data);

        AuditLogger::log(
            request: $request,
            action: 'inventory.category.create',
            module: 'inventory',
            description: "Tambah kategori inventaris {$category->code} - {$category->name}",
            newValues: $category->toArray(),
        );

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => $category,
        ], 201);
    }

    public function updateCategory(
        Request $request,
        InventoryCategory $inventoryCategory,
    ): JsonResponse {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_categories', 'code')->ignore($inventoryCategory->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldValues = $inventoryCategory->toArray();
        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['updated_by'] = $request->user()->id;

        $inventoryCategory->update($data);

        AuditLogger::log(
            request: $request,
            action: 'inventory.category.update',
            module: 'inventory',
            description: "Ubah kategori inventaris {$inventoryCategory->code}",
            oldValues: $oldValues,
            newValues: $inventoryCategory->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $inventoryCategory->fresh(),
        ]);
    }

    public function uoms(): JsonResponse
    {
        return response()->json([
            'data' => InventoryUom::query()
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeUom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:100', 'unique:inventory_uoms,code'],
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['symbol'] = isset($data['symbol']) ? trim($data['symbol']) : null;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $uom = InventoryUom::create($data);

        AuditLogger::log(
            request: $request,
            action: 'inventory.uom.create',
            module: 'inventory',
            description: "Tambah satuan inventaris {$uom->code} - {$uom->name}",
            newValues: $uom->toArray(),
        );

        return response()->json([
            'message' => 'Satuan berhasil ditambahkan.',
            'data' => $uom,
        ], 201);
    }

    public function updateUom(
        Request $request,
        InventoryUom $inventoryUom,
    ): JsonResponse {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_uoms', 'code')->ignore($inventoryUom->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:50'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldValues = $inventoryUom->toArray();
        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['symbol'] = isset($data['symbol']) ? trim($data['symbol']) : null;
        $data['updated_by'] = $request->user()->id;

        $inventoryUom->update($data);

        AuditLogger::log(
            request: $request,
            action: 'inventory.uom.update',
            module: 'inventory',
            description: "Ubah satuan inventaris {$inventoryUom->code}",
            oldValues: $oldValues,
            newValues: $inventoryUom->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Satuan berhasil diperbarui.',
            'data' => $inventoryUom->fresh(),
        ]);
    }

    public function warehouses(): JsonResponse
    {
        return response()->json([
            'data' => InventoryWarehouse::query()
                ->with('unit:id,code,name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:100', 'unique:inventory_warehouses,code'],
            'name' => ['required', 'string', 'max:255'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'location' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        $warehouse = InventoryWarehouse::create($data)
            ->load('unit:id,code,name');

        AuditLogger::log(
            request: $request,
            action: 'inventory.warehouse.create',
            module: 'inventory',
            description: "Tambah gudang inventaris {$warehouse->code} - {$warehouse->name}",
            newValues: $warehouse->toArray(),
        );

        return response()->json([
            'message' => 'Gudang berhasil ditambahkan.',
            'data' => $warehouse,
        ], 201);
    }

    public function updateWarehouse(
        Request $request,
        InventoryWarehouse $inventoryWarehouse,
    ): JsonResponse {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_warehouses', 'code')->ignore($inventoryWarehouse->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'location' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldValues = $inventoryWarehouse->toArray();
        $data['code'] = Str::upper(trim($data['code']));
        $data['name'] = trim($data['name']);
        $data['updated_by'] = $request->user()->id;

        $inventoryWarehouse->update($data);
        $inventoryWarehouse->refresh()->load('unit:id,code,name');

        AuditLogger::log(
            request: $request,
            action: 'inventory.warehouse.update',
            module: 'inventory',
            description: "Ubah gudang inventaris {$inventoryWarehouse->code}",
            oldValues: $oldValues,
            newValues: $inventoryWarehouse->toArray(),
        );

        return response()->json([
            'message' => 'Gudang berhasil diperbarui.',
            'data' => $inventoryWarehouse,
        ]);
    }

    public function stocks(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $warehouseId = $request->query('warehouse_id');
        $perPage = min(max((int) $request->query('per_page', 10), 5), 100);

        $query = InventoryStock::query()
            ->with([
                'item:id,code,name,category_id,uom_id,minimum_stock,is_active',
                'item.category:id,code,name',
                'item.uom:id,code,name,symbol',
                'warehouse:id,code,name,unit_id',
                'warehouse.unit:id,code,name',
            ]);

        if ($search !== '') {
            $query->whereHas('item', function ($itemQuery) use ($search) {
                $itemQuery
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $paginator = $query
            ->orderBy('warehouse_id')
            ->orderBy('item_id')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->getCollection()->transform(function (InventoryStock $stock) {
            $minimumStock = (float) ($stock->item?->minimum_stock ?? 0);

            $stock->is_low_stock = $minimumStock > 0
                && (float) $stock->quantity <= $minimumStock;

            return $stock;
        });

        return response()->json($paginator);
    }

    public function stockIn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_id' => ['required', 'integer', 'exists:inventory_items,id'],
            'warehouse_id' => ['required', 'integer', 'exists:inventory_warehouses,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $movement = $this->stockService->stockIn(
            itemId: (int) $data['item_id'],
            warehouseId: (int) $data['warehouse_id'],
            quantity: (float) $data['quantity'],
            userId: $request->user()->id,
            supplierId: isset($data['supplier_id']) ? (int) $data['supplier_id'] : null,
            notes: $data['notes'] ?? null,
        )->load([
            'item:id,code,name,uom_id',
            'item.uom:id,name,symbol',
            'warehouse:id,code,name',
            'supplier:id,code,name',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.stock.in',
            module: 'inventory',
            description: "Barang masuk {$movement->item?->name}",
            newValues: $movement->toArray(),
        );

        return response()->json([
            'message' => 'Barang masuk berhasil disimpan.',
            'data' => $movement,
        ], 201);
    }

    public function stockOut(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_id' => ['required', 'integer', 'exists:inventory_items,id'],
            'warehouse_id' => ['required', 'integer', 'exists:inventory_warehouses,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'destination_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $movement = $this->stockService->stockOut(
            itemId: (int) $data['item_id'],
            warehouseId: (int) $data['warehouse_id'],
            quantity: (float) $data['quantity'],
            userId: $request->user()->id,
            destinationUnitId: isset($data['destination_unit_id'])
                ? (int) $data['destination_unit_id']
                : null,
            notes: $data['notes'] ?? null,
        )->load([
            'item:id,code,name,uom_id',
            'item.uom:id,name,symbol',
            'warehouse:id,code,name',
            'destinationUnit:id,code,name',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.stock.out',
            module: 'inventory',
            description: "Barang keluar {$movement->item?->name}",
            newValues: $movement->toArray(),
        );

        return response()->json([
            'message' => 'Barang keluar berhasil disimpan.',
            'data' => $movement,
        ], 201);
    }

    public function movements(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $movementType = $request->query('movement_type');
        $warehouseId = $request->query('warehouse_id');
        $perPage = min(max((int) $request->query('per_page', 10), 5), 100);

        $query = InventoryStockMovement::query()
            ->with([
                'item:id,code,name,uom_id',
                'item.uom:id,name,symbol',
                'warehouse:id,code,name',
                'supplier:id,code,name',
                'destinationUnit:id,code,name',
            ]);

        if ($search !== '') {
            $query->whereHas('item', function ($itemQuery) use ($search) {
                $itemQuery
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($movementType) {
            $query->where('movement_type', $movementType);
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return response()->json(
            $query
                ->latest('id')
                ->paginate($perPage)
                ->withQueryString()
        );
    }

    public function requests(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $unitId = $request->query('unit_id');
        $search = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->query('per_page', 10), 5), 100);

        $query = InventoryRequest::query()
            ->with([
                'unit:id,code,name',
                'warehouse:id,code,name',
                'items.item:id,code,name,uom_id',
                'items.item.uom:id,name,symbol',
                'requestedBy:id,name,username',
                'approvedBy:id,name,username',
                'distributedBy:id,name,username',
            ]);

        if ($status) {
            $query->where('status', $status);
        }

        if ($unitId) {
            $query->where('unit_id', $unitId);
        }

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('request_number', 'like', "%{$search}%")
                    ->orWhereHas('unit', function ($unitQuery) use ($search) {
                        $unitQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json(
            $query
                ->latest('id')
                ->paginate($perPage)
                ->withQueryString()
        );
    }

    public function storeRequest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'warehouse_id' => ['required', 'integer', 'exists:inventory_warehouses,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'exists:inventory_items,id', 'distinct'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $inventoryRequest = DB::transaction(function () use ($request, $data) {
            $inventoryRequest = InventoryRequest::create([
                'request_number' => $this->generateRequestNumber(),
                'unit_id' => $data['unit_id'],
                'warehouse_id' => $data['warehouse_id'],
                'status' => 'submitted',
                'notes' => $data['notes'] ?? null,
                'requested_by' => $request->user()->id,
            ]);

            foreach ($data['items'] as $item) {
                InventoryRequestItem::create([
                    'inventory_request_id' => $inventoryRequest->id,
                    'item_id' => $item['item_id'],
                    'requested_quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $inventoryRequest->fresh([
                'unit:id,code,name',
                'warehouse:id,code,name',
                'items.item:id,code,name,uom_id',
                'items.item.uom:id,name,symbol',
                'requestedBy:id,name,username',
            ]);
        });

        AuditLogger::log(
            request: $request,
            action: 'inventory.request.create',
            module: 'inventory',
            description: "Buat permintaan inventaris {$inventoryRequest->request_number}",
            newValues: $inventoryRequest->toArray(),
        );

        return response()->json([
            'message' => 'Permintaan unit berhasil dibuat.',
            'data' => $inventoryRequest,
        ], 201);
    }

    public function approveRequest(
        Request $request,
        InventoryRequest $inventoryRequest,
    ): JsonResponse {
        $data = $request->validate([
            'items' => ['nullable', 'array'],
            'items.*.item_id' => ['required_with:items', 'integer', 'exists:inventory_items,id', 'distinct'],
            'items.*.approved_quantity' => ['required_with:items', 'numeric', 'min:0'],
        ]);

        if ($inventoryRequest->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => 'Hanya permintaan berstatus submitted yang dapat disetujui.',
            ]);
        }

        $oldValues = $inventoryRequest->load('items')->toArray();

        DB::transaction(function () use (
            $request,
            $data,
            $inventoryRequest,
        ) {
            $inventoryRequest->load('items');

            $approvedMap = collect($data['items'] ?? [])
                ->keyBy('item_id');

            foreach ($inventoryRequest->items as $requestItem) {
                $approvedQuantity = $approvedMap->has($requestItem->item_id)
                    ? (float) $approvedMap[$requestItem->item_id]['approved_quantity']
                    : (float) $requestItem->requested_quantity;

                if ($approvedQuantity > (float) $requestItem->requested_quantity) {
                    throw ValidationException::withMessages([
                        'items' => 'Jumlah disetujui tidak boleh melebihi jumlah permintaan.',
                    ]);
                }

                $requestItem->update([
                    'approved_quantity' => $approvedQuantity,
                ]);
            }

            $inventoryRequest->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);
        });

        $inventoryRequest->refresh()->load([
            'unit:id,code,name',
            'warehouse:id,code,name',
            'items.item:id,code,name,uom_id',
            'items.item.uom:id,name,symbol',
            'requestedBy:id,name,username',
            'approvedBy:id,name,username',
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.request.approve',
            module: 'inventory',
            description: "Setujui permintaan inventaris {$inventoryRequest->request_number}",
            oldValues: $oldValues,
            newValues: $inventoryRequest->toArray(),
        );

        return response()->json([
            'message' => 'Permintaan berhasil disetujui.',
            'data' => $inventoryRequest,
        ]);
    }

    public function rejectRequest(
        Request $request,
        InventoryRequest $inventoryRequest,
    ): JsonResponse {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        if ($inventoryRequest->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => 'Hanya permintaan berstatus submitted yang dapat ditolak.',
            ]);
        }

        $oldValues = $inventoryRequest->toArray();

        $inventoryRequest->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => trim($data['reason']),
        ]);

        AuditLogger::log(
            request: $request,
            action: 'inventory.request.reject',
            module: 'inventory',
            description: "Tolak permintaan inventaris {$inventoryRequest->request_number}",
            oldValues: $oldValues,
            newValues: $inventoryRequest->fresh()->toArray(),
        );

        return response()->json([
            'message' => 'Permintaan berhasil ditolak.',
            'data' => $inventoryRequest->fresh(),
        ]);
    }

    public function distributeRequest(
        Request $request,
        InventoryRequest $inventoryRequest,
    ): JsonResponse {
        $oldValues = $inventoryRequest->load('items')->toArray();

        $distributed = $this->stockService->distribute(
            inventoryRequest: $inventoryRequest,
            userId: $request->user()->id,
        );

        AuditLogger::log(
            request: $request,
            action: 'inventory.request.distribute',
            module: 'inventory',
            description: "Distribusi permintaan inventaris {$distributed->request_number}",
            oldValues: $oldValues,
            newValues: $distributed->toArray(),
        );

        return response()->json([
            'message' => 'Barang permintaan berhasil didistribusikan.',
            'data' => $distributed,
        ]);
    }

    public function stockOpname(Request $request): JsonResponse
    {
        $data = $request->validate([
            'warehouse_id' => ['required', 'integer', 'exists:inventory_warehouses,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'exists:inventory_items,id', 'distinct'],
            'items.*.physical_stock' => ['required', 'numeric', 'min:0'],
        ]);

        $opname = $this->stockService->opname(
            warehouseId: (int) $data['warehouse_id'],
            items: $data['items'],
            userId: $request->user()->id,
            notes: $data['notes'] ?? null,
        );

        AuditLogger::log(
            request: $request,
            action: 'inventory.opname.create',
            module: 'inventory',
            description: "Stock opname inventaris {$opname->opname_number}",
            newValues: $opname->toArray(),
        );

        return response()->json([
            'message' => 'Stock opname inventaris berhasil disimpan.',
            'data' => $opname,
        ], 201);
    }

    private function generateRequestNumber(): string
    {
        return sprintf(
            'INV-REQ-%s-%s',
            now()->format('YmdHis'),
            Str::upper(Str::random(4)),
        );
    }
}
