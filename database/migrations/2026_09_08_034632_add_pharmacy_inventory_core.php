<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PRESCRIPTION VERIFICATION
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasColumn('prescriptions', 'verified_at')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->timestamp('verified_at')
                    ->nullable()
                    ->after('submitted_at');
            });
        }

        if (!Schema::hasColumn('prescriptions', 'verified_by')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->foreignId('verified_by')
                    ->nullable()
                    ->after('verified_at')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('prescriptions', 'verification_notes')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->text('verification_notes')
                    ->nullable()
                    ->after('verified_by');
            });
        }

        if (!Schema::hasColumn('prescriptions', 'cancellation_reason')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->text('cancellation_reason')
                    ->nullable()
                    ->after('cancelled_at');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | PRESCRIPTION SUBSTITUTION
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasColumn('prescription_items', 'original_medicine_id')) {
            Schema::table('prescription_items', function (Blueprint $table) {
                $table->foreignId('original_medicine_id')
                    ->nullable()
                    ->after('medicine_id')
                    ->constrained('medicines')
                    ->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('prescription_items', 'substitution_reason')) {
            Schema::table('prescription_items', function (Blueprint $table) {
                $table->text('substitution_reason')
                    ->nullable()
                    ->after('instruction');
            });
        }

        if (!Schema::hasColumn('prescription_items', 'substituted_by')) {
            Schema::table('prescription_items', function (Blueprint $table) {
                $table->foreignId('substituted_by')
                    ->nullable()
                    ->after('substitution_reason')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('prescription_items', 'substituted_at')) {
            Schema::table('prescription_items', function (Blueprint $table) {
                $table->timestamp('substituted_at')
                    ->nullable()
                    ->after('substituted_by');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | MINIMUM STOCK
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasColumn('medicines', 'minimum_stock')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->decimal('minimum_stock', 12, 2)
                    ->default(0)
                    ->after('unit');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | SUPPLIERS
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('suppliers')) {
            Schema::create('suppliers', function (Blueprint $table) {
                $table->id();

                $table->string('code')->unique();
                $table->string('name');
                $table->string('contact_person')->nullable();
                $table->string('phone')->nullable();
                $table->string('email')->nullable();
                $table->text('address')->nullable();

                $table->boolean('is_active')->default(true);

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();
            });
        }

        /*
        |--------------------------------------------------------------------------
        | MEDICINE BATCHES
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('medicine_batches')) {
            Schema::create('medicine_batches', function (Blueprint $table) {
                $table->id();

                $table->foreignId('medicine_id')
                    ->constrained('medicines')
                    ->restrictOnDelete();

                $table->foreignId('supplier_id')
                    ->nullable()
                    ->constrained('suppliers')
                    ->nullOnDelete();

                $table->string('batch_number');

                $table->date('expired_at')->nullable();

                $table->decimal('stock', 12, 2)->default(0);

                $table->decimal('purchase_price', 15, 2)
                    ->nullable();

                $table->decimal('selling_price', 15, 2)
                    ->nullable();

                $table->date('received_at')->nullable();

                $table->boolean('is_active')->default(true);

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->unique([
                    'medicine_id',
                    'batch_number',
                ]);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STOCK MOVEMENTS
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('stock_movements')) {
            Schema::create('stock_movements', function (Blueprint $table) {
                $table->id();

                $table->foreignId('medicine_id')
                    ->constrained('medicines')
                    ->restrictOnDelete();

                $table->foreignId('medicine_batch_id')
                    ->nullable()
                    ->constrained('medicine_batches')
                    ->nullOnDelete();

                $table->enum('movement_type', [
                    'receive',
                    'dispense',
                    'opname',
                    'adjustment',
                    'return',
                ]);

                /*
                 * Positive = stok bertambah
                 * Negative = stok berkurang
                 */
                $table->decimal('quantity_change', 12, 2);

                $table->decimal('stock_before', 12, 2);
                $table->decimal('stock_after', 12, 2);

                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();

                $table->text('notes')->nullable();

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->index([
                    'medicine_id',
                    'created_at',
                ]);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | PRESCRIPTION DISPENSE BATCH TRACE
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('prescription_dispense_items')) {
            Schema::create(
                'prescription_dispense_items',
                function (Blueprint $table) {
                    $table->id();

                    $table->foreignId('prescription_id')
                        ->constrained('prescriptions')
                        ->cascadeOnDelete();

                    $table->foreignId('prescription_item_id')
                        ->constrained('prescription_items')
                        ->cascadeOnDelete();

                    $table->foreignId('medicine_batch_id')
                        ->constrained('medicine_batches')
                        ->restrictOnDelete();

                    $table->decimal('quantity', 12, 2);

                    $table->foreignId('created_by')
                        ->nullable()
                        ->constrained('users')
                        ->nullOnDelete();

                    $table->timestamps();
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STOCK OPNAME
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('stock_opnames')) {
            Schema::create('stock_opnames', function (Blueprint $table) {
                $table->id();

                $table->string('opname_number')->unique();

                $table->string('status')->default('completed');

                $table->text('notes')->nullable();

                $table->timestamp('completed_at')->nullable();

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();
            });
        }

        if (!Schema::hasTable('stock_opname_items')) {
            Schema::create(
                'stock_opname_items',
                function (Blueprint $table) {
                    $table->id();

                    $table->foreignId('stock_opname_id')
                        ->constrained('stock_opnames')
                        ->cascadeOnDelete();

                    $table->foreignId('medicine_batch_id')
                        ->constrained('medicine_batches')
                        ->restrictOnDelete();

                    $table->decimal('system_stock', 12, 2);
                    $table->decimal('physical_stock', 12, 2);
                    $table->decimal('difference', 12, 2);

                    $table->timestamps();

                    $table->unique([
                        'stock_opname_id',
                        'medicine_batch_id',
                    ]);
                }
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
        Schema::dropIfExists('prescription_dispense_items');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('medicine_batches');
        Schema::dropIfExists('suppliers');

        if (Schema::hasColumn('medicines', 'minimum_stock')) {
            Schema::table('medicines', function (Blueprint $table) {
                $table->dropColumn('minimum_stock');
            });
        }

        if (Schema::hasColumn(
            'prescription_items',
            'substituted_by'
        )) {
            Schema::table(
                'prescription_items',
                function (Blueprint $table) {
                    $table->dropConstrainedForeignId(
                        'substituted_by'
                    );
                }
            );
        }

        if (Schema::hasColumn(
            'prescription_items',
            'original_medicine_id'
        )) {
            Schema::table(
                'prescription_items',
                function (Blueprint $table) {
                    $table->dropConstrainedForeignId(
                        'original_medicine_id'
                    );
                }
            );
        }

        foreach ([
            'substitution_reason',
            'substituted_at',
        ] as $column) {
            if (Schema::hasColumn(
                'prescription_items',
                $column
            )) {
                Schema::table(
                    'prescription_items',
                    function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    }
                );
            }
        }

        if (Schema::hasColumn(
            'prescriptions',
            'verified_by'
        )) {
            Schema::table(
                'prescriptions',
                function (Blueprint $table) {
                    $table->dropConstrainedForeignId(
                        'verified_by'
                    );
                }
            );
        }

        foreach ([
            'verified_at',
            'verification_notes',
            'cancellation_reason',
        ] as $column) {
            if (Schema::hasColumn(
                'prescriptions',
                $column
            )) {
                Schema::table(
                    'prescriptions',
                    function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    }
                );
            }
        }
    }
};