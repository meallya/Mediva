<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class BillingSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $permissions = [
            ['name' => 'Lihat Billing', 'slug' => 'billing.view', 'module' => 'billing'],
            ['name' => 'Buat Billing', 'slug' => 'billing.create', 'module' => 'billing'],
            ['name' => 'Ubah Billing', 'slug' => 'billing.update', 'module' => 'billing'],
            ['name' => 'Batalkan Billing', 'slug' => 'billing.cancel', 'module' => 'billing'],
            ['name' => 'Kelola Pembayaran', 'slug' => 'billing.payment', 'module' => 'billing'],
            ['name' => 'Cetak Invoice dan Receipt', 'slug' => 'billing.receipt', 'module' => 'billing'],
            ['name' => 'Lihat Tarif', 'slug' => 'tariff.view', 'module' => 'billing'],
            ['name' => 'Kelola Tarif', 'slug' => 'tariff.manage', 'module' => 'billing'],
            ['name' => 'Lihat Metode Bayar', 'slug' => 'payment_method.view', 'module' => 'billing'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT + ROLE FINANCE
        |--------------------------------------------------------------------------
        */

        $financeUnit = Unit::updateOrCreate(
            ['code' => 'FINANCE'],
            [
                'name' => 'Keuangan & Kasir',
                'type' => 'finance',
                'is_active' => true,
            ],
        );

        $financeRole = Role::updateOrCreate(
            ['slug' => 'finance'],
            [
                'name' => 'Keuangan',
                'description' => 'Billing, kasir, pembayaran, transaksi, dan tarif.',
                'is_active' => true,
            ],
        );

        $financePermissionIds = Permission::query()
            ->whereIn('slug', [
                'billing.view',
                'billing.create',
                'billing.update',
                'billing.cancel',
                'billing.payment',
                'billing.receipt',
                'tariff.view',
                'tariff.manage',
                'payment_method.view',
            ])
            ->pluck('id')
            ->all();

        $financeRole->permissions()->syncWithoutDetaching(
            $financePermissionIds,
        );

        /*
        |--------------------------------------------------------------------------
        | IT HANYA MONITORING BILLING + TARIFF
        |--------------------------------------------------------------------------
        */

        $itRole = Role::query()
            ->where('slug', 'it')
            ->first();

        if ($itRole) {
            /*
            | Pastikan IT tetap read-only untuk transaksi Billing.
            */
            $mutationPermissionIds = Permission::query()
                ->whereIn('slug', [
                    'billing.create',
                    'billing.update',
                    'billing.cancel',
                    'billing.payment',
                    'billing.receipt',
                    'tariff.manage',
                ])
                ->pluck('id')
                ->all();

            $itRole->permissions()->detach($mutationPermissionIds);

            $itPermissionIds = Permission::query()
                ->whereIn('slug', [
                    'billing.view',
                    'tariff.view',
                    'payment_method.view',
                ])
                ->pluck('id')
                ->all();

            $itRole->permissions()->syncWithoutDetaching(
                $itPermissionIds,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | USER TEST FINANCE
        |--------------------------------------------------------------------------
        */

        $employee = Employee::updateOrCreate(
            ['employee_number' => 'EMP-FIN-0001'],
            [
                'name' => 'Petugas Keuangan',
                'email' => 'finance@mediva.local',
                'phone' => null,
                'is_active' => true,
            ],
        );

        $user = User::updateOrCreate(
            ['email' => 'finance@mediva.local'],
            [
                'employee_id' => $employee->id,
                'username' => 'finance',
                'name' => 'Petugas Keuangan',
                'password' => Hash::make('mediva123'),
                'is_active' => true,
            ],
        );

        $assignment = RoleAssignment::updateOrCreate(
            [
                'user_id' => $user->id,
                'role_id' => $financeRole->id,
                'unit_id' => $financeUnit->id,
            ],
            [
                'is_default' => true,
                'is_active' => true,
            ],
        );

        RoleAssignment::query()
            ->where('user_id', $user->id)
            ->where('id', '!=', $assignment->id)
            ->update([
                'is_default' => false,
            ]);

        /*
        |--------------------------------------------------------------------------
        | DEFAULT PAYMENT METHODS
        |--------------------------------------------------------------------------
        |
        | Semua masih MANUAL. Tidak ada payment gateway.
        |
        */

        if (Schema::hasTable('payment_methods')) {
            $columns = Schema::getColumnListing('payment_methods');

            $methods = [
                ['code' => 'CASH', 'name' => 'Tunai'],
                ['code' => 'TRANSFER', 'name' => 'Transfer Bank'],
                ['code' => 'DEBIT', 'name' => 'Kartu Debit'],
                ['code' => 'CREDIT', 'name' => 'Kartu Kredit'],
                ['code' => 'QRIS', 'name' => 'QRIS Manual'],
            ];

            foreach ($methods as $method) {
                $key = in_array('code', $columns, true)
                    ? ['code' => $method['code']]
                    : ['name' => $method['name']];

                $data = [];

                if (in_array('code', $columns, true)) {
                    $data['code'] = $method['code'];
                }

                if (in_array('name', $columns, true)) {
                    $data['name'] = $method['name'];
                }

                if (in_array('type', $columns, true)) {
                    $data['type'] = 'manual';
                }

                if (in_array('is_active', $columns, true)) {
                    $data['is_active'] = true;
                }

                if (in_array('created_at', $columns, true)) {
                    $data['created_at'] = now();
                }

                if (in_array('updated_at', $columns, true)) {
                    $data['updated_at'] = now();
                }

                DB::table('payment_methods')->updateOrInsert(
                    $key,
                    $data,
                );
            }
        }
    }
}
