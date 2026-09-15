<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('procurement_requests')) {
            Schema::create('procurement_requests', function (Blueprint $table) {
                $table->id();
                $table->string('request_number')->unique();
                $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
                $table->enum('status', ['submitted', 'approved', 'rejected', 'ordered', 'partially_received', 'completed', 'cancelled'])->default('submitted');
                $table->text('notes')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->index(['status', 'created_at']);
            });
        }

        if (!Schema::hasTable('procurement_quotation_items')) {
    Schema::create('procurement_quotation_items', function (Blueprint $table) {
        $table->id();

        $table->foreignId('procurement_quotation_id')
            ->constrained('procurement_quotations')
            ->cascadeOnDelete();

        $table->foreignId('procurement_request_item_id')
            ->constrained('procurement_request_items')
            ->cascadeOnDelete();

        $table->decimal('quantity', 12, 2);

        $table->decimal('unit_price', 15, 2);

        $table->decimal('line_total', 15, 2);

        $table->timestamps();

        $table->unique(
            [
                'procurement_quotation_id',
                'procurement_request_item_id',
            ],
            'pq_items_quote_request_unique'
        );
    });
}

if (
    Schema::hasTable('procurement_quotation_items') &&
    !Schema::hasIndex(
        'procurement_quotation_items',
        'pq_items_quote_request_unique'
    )
) {
    Schema::table(
        'procurement_quotation_items',
        function (Blueprint $table) {
            $table->unique(
                [
                    'procurement_quotation_id',
                    'procurement_request_item_id',
                ],
                'pq_items_quote_request_unique'
            );
        }
    );
}

        if (!Schema::hasTable('procurement_quotations')) {
            Schema::create('procurement_quotations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('procurement_request_id')->constrained('procurement_requests')->cascadeOnDelete();
                $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
                $table->string('quotation_number', 100)->nullable();
                $table->date('quotation_date')->nullable();
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->boolean('is_selected')->default(false);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->unique(['procurement_request_id', 'supplier_id']);
            });
        }

        if (!Schema::hasTable('procurement_quotation_items')) {
            Schema::create('procurement_quotation_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('procurement_quotation_id')->constrained('procurement_quotations')->cascadeOnDelete();
                $table->foreignId('procurement_request_item_id')->constrained('procurement_request_items')->cascadeOnDelete();
                $table->decimal('quantity', 12, 2);
                $table->decimal('unit_price', 15, 2);
                $table->decimal('line_total', 15, 2);
                $table->timestamps();
                $table->unique(['procurement_quotation_id', 'procurement_request_item_id']);
            });
        }

        if (!Schema::hasTable('purchase_orders')) {
            Schema::create('purchase_orders', function (Blueprint $table) {
                $table->id();
                $table->string('order_number')->unique();
                $table->foreignId('procurement_request_id')->nullable()->constrained('procurement_requests')->nullOnDelete();
                $table->foreignId('procurement_quotation_id')->nullable()->constrained('procurement_quotations')->nullOnDelete();
                $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
                $table->enum('status', ['draft', 'issued', 'partially_received', 'received', 'cancelled'])->default('draft');
                $table->date('order_date')->nullable();
                $table->date('expected_date')->nullable();
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['status', 'order_date']);
            });
        }

        if (!Schema::hasTable('purchase_order_items')) {
            Schema::create('purchase_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
                $table->foreignId('procurement_request_item_id')->nullable()->constrained('procurement_request_items')->nullOnDelete();
                $table->enum('item_kind', ['inventory', 'asset', 'medical_equipment']);
                $table->foreignId('inventory_item_id')->nullable()->constrained('inventory_items')->nullOnDelete();
                $table->foreignId('asset_category_id')->nullable()->constrained('asset_categories')->nullOnDelete();
                $table->string('item_name', 200);
                $table->text('specification')->nullable();
                $table->decimal('quantity', 12, 2);
                $table->decimal('unit_price', 15, 2);
                $table->decimal('received_quantity', 12, 2)->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('procurement_receipts')) {
            Schema::create('procurement_receipts', function (Blueprint $table) {
                $table->id();
                $table->string('receipt_number')->unique();
                $table->foreignId('purchase_order_id')->constrained('purchase_orders')->restrictOnDelete();
                $table->foreignId('warehouse_id')->nullable()->constrained('inventory_warehouses')->nullOnDelete();
                $table->date('received_date');
                $table->text('notes')->nullable();
                $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('procurement_receipt_items')) {
            Schema::create('procurement_receipt_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('procurement_receipt_id')->constrained('procurement_receipts')->cascadeOnDelete();
                $table->foreignId('purchase_order_item_id')->constrained('purchase_order_items')->restrictOnDelete();
                $table->decimal('quantity_received', 12, 2);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('procurement_receipt_items');
        Schema::dropIfExists('procurement_receipts');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('procurement_quotation_items');
        Schema::dropIfExists('procurement_quotations');
        Schema::dropIfExists('procurement_request_items');
        Schema::dropIfExists('procurement_requests');
    }
};
