<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inventory_categories')) {
            Schema::create('inventory_categories', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventory_uoms')) {
            Schema::create('inventory_uoms', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('symbol')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventory_warehouses')) {
            Schema::create('inventory_warehouses', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
                $table->string('location')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventory_items')) {
            Schema::create('inventory_items', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('category_id')->nullable()->constrained('inventory_categories')->nullOnDelete();
                $table->foreignId('uom_id')->constrained('inventory_uoms')->restrictOnDelete();
                $table->foreignId('default_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
                $table->decimal('minimum_stock', 12, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['category_id', 'is_active']);
            });
        }

        if (!Schema::hasTable('inventory_stocks')) {
            Schema::create('inventory_stocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
                $table->foreignId('warehouse_id')->constrained('inventory_warehouses')->restrictOnDelete();
                $table->decimal('quantity', 12, 2)->default(0);
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['item_id', 'warehouse_id']);
                $table->index(['warehouse_id', 'quantity']);
            });
        }

        if (!Schema::hasTable('inventory_stock_movements')) {
            Schema::create('inventory_stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
                $table->foreignId('warehouse_id')->constrained('inventory_warehouses')->restrictOnDelete();
                $table->enum('movement_type', [
                    'stock_in',
                    'stock_out',
                    'distribution',
                    'opname',
                    'adjustment',
                    'return',
                ]);
                $table->decimal('quantity_change', 12, 2);
                $table->decimal('stock_before', 12, 2);
                $table->decimal('stock_after', 12, 2);
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
                $table->foreignId('destination_unit_id')->nullable()->constrained('units')->nullOnDelete();
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['item_id', 'created_at']);
                $table->index(['warehouse_id', 'created_at']);
                $table->index(['movement_type', 'created_at']);
            });
        }

        if (!Schema::hasTable('inventory_requests')) {
            Schema::create('inventory_requests', function (Blueprint $table) {
                $table->id();
                $table->string('request_number')->unique();
                $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
                $table->foreignId('warehouse_id')->constrained('inventory_warehouses')->restrictOnDelete();
                $table->enum('status', [
                    'submitted',
                    'approved',
                    'rejected',
                    'distributed',
                    'cancelled',
                ])->default('submitted');
                $table->text('notes')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('distributed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('distributed_at')->nullable();
                $table->timestamps();

                $table->index(['status', 'created_at']);
                $table->index(['unit_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('inventory_request_items')) {
            Schema::create('inventory_request_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_request_id')->constrained('inventory_requests')->cascadeOnDelete();
                $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
                $table->decimal('requested_quantity', 12, 2);
                $table->decimal('approved_quantity', 12, 2)->nullable();
                $table->decimal('distributed_quantity', 12, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['inventory_request_id', 'item_id']);
            });
        }

        if (!Schema::hasTable('inventory_stock_opnames')) {
            Schema::create('inventory_stock_opnames', function (Blueprint $table) {
                $table->id();
                $table->string('opname_number')->unique();
                $table->foreignId('warehouse_id')->constrained('inventory_warehouses')->restrictOnDelete();
                $table->string('status')->default('completed');
                $table->text('notes')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventory_stock_opname_items')) {
            Schema::create('inventory_stock_opname_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('inventory_stock_opname_id')->constrained('inventory_stock_opnames')->cascadeOnDelete();
                $table->foreignId('item_id')->constrained('inventory_items')->restrictOnDelete();
                $table->decimal('system_stock', 12, 2);
                $table->decimal('physical_stock', 12, 2);
                $table->decimal('difference', 12, 2);
                $table->timestamps();

                $table->unique(['inventory_stock_opname_id', 'item_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_stock_opname_items');
        Schema::dropIfExists('inventory_stock_opnames');
        Schema::dropIfExists('inventory_request_items');
        Schema::dropIfExists('inventory_requests');
        Schema::dropIfExists('inventory_stock_movements');
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_warehouses');
        Schema::dropIfExists('inventory_uoms');
        Schema::dropIfExists('inventory_categories');
    }
};
