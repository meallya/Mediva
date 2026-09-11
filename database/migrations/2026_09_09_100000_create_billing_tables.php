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
        | TARIFFS
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('tariffs')) {
            Schema::create('tariffs', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name', 150);
                $table->enum('category', [
                    'registration',
                    'doctor_service',
                    'procedure',
                    'other_service',
                ]);
                $table->decimal('amount', 15, 2)->default(0);

                $table->foreignId('unit_id')
                    ->nullable()
                    ->constrained('units')
                    ->nullOnDelete();

                $table->foreignId('doctor_id')
                    ->nullable()
                    ->constrained('doctors')
                    ->nullOnDelete();

                $table->string('reference_code', 100)->nullable();
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

                $table->index(['category', 'is_active']);
                $table->index(['unit_id', 'category']);
                $table->index(['doctor_id', 'category']);
                $table->index(['reference_code', 'category']);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENT METHODS
        |--------------------------------------------------------------------------
        |
        | MEDIVA sudah memiliki route Master Payment Method pada beberapa versi.
        | Karena itu tabel hanya dibuat jika memang belum ada.
        |
        */

        if (!Schema::hasTable('payment_methods')) {
            Schema::create('payment_methods', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name', 100);
                $table->string('type', 50)->nullable();
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
        | INVOICES
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->string('invoice_number', 60)->unique();

                $table->foreignId('visit_id')
                    ->unique()
                    ->constrained('visits')
                    ->restrictOnDelete();

                $table->foreignId('patient_id')
                    ->constrained('patients')
                    ->restrictOnDelete();

                $table->enum('status', [
                    'unpaid',
                    'partial',
                    'paid',
                    'cancelled',
                ])->default('unpaid');

                $table->decimal('subtotal', 15, 2)->default(0);
                $table->decimal('discount', 15, 2)->default(0);
                $table->decimal('grand_total', 15, 2)->default(0);
                $table->decimal('paid_amount', 15, 2)->default(0);
                $table->decimal('balance_due', 15, 2)->default(0);

                $table->dateTime('generated_at')->nullable();
                $table->dateTime('cancelled_at')->nullable();
                $table->text('cancellation_reason')->nullable();

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->index(['status', 'generated_at']);
                $table->index(['patient_id', 'status']);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | INVOICE ITEMS
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('invoice_items')) {
            Schema::create('invoice_items', function (Blueprint $table) {
                $table->id();

                $table->foreignId('invoice_id')
                    ->constrained('invoices')
                    ->cascadeOnDelete();

                $table->foreignId('tariff_id')
                    ->nullable()
                    ->constrained('tariffs')
                    ->nullOnDelete();

                $table->enum('category', [
                    'registration',
                    'doctor_service',
                    'procedure',
                    'medicine',
                    'other_service',
                    'laboratory',
                    'radiology',
                ]);

                $table->string('source_type', 100)->nullable();
                $table->unsignedBigInteger('source_id')->nullable();
                $table->string('code', 100)->nullable();
                $table->string('description', 255);
                $table->decimal('quantity', 12, 2)->default(1);
                $table->decimal('unit_price', 15, 2)->default(0);
                $table->decimal('total', 15, 2)->default(0);
                $table->boolean('is_manual')->default(false);

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('updated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->index(['invoice_id', 'category']);
                $table->index(['source_type', 'source_id']);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENTS
        |--------------------------------------------------------------------------
        */

        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->string('payment_number', 60)->unique();

                $table->foreignId('invoice_id')
                    ->constrained('invoices')
                    ->restrictOnDelete();

                $table->unsignedBigInteger('payment_method_id');
                $table->decimal('amount', 15, 2);
                $table->dateTime('paid_at');
                $table->string('reference_number', 120)->nullable();
                $table->text('notes')->nullable();

                $table->enum('status', [
                    'posted',
                    'void',
                ])->default('posted');

                $table->dateTime('voided_at')->nullable();
                $table->foreignId('voided_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
                $table->text('void_reason')->nullable();

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamps();

                $table->index(['invoice_id', 'status']);
                $table->index(['payment_method_id', 'status']);
                $table->index(['paid_at', 'status']);
            });
        }
    }

    public function down(): void
    {
        /*
        |--------------------------------------------------------------------------
        | SAFE ROLLBACK
        |--------------------------------------------------------------------------
        |
        | payment_methods sengaja TIDAK di-drop karena pada project MEDIVA lama
        | tabel itu mungkin sudah dimiliki modul Master Data.
        |
        */

        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('tariffs');
    }
};
