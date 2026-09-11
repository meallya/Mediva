<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PharmacyInventoryPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'Verify Prescription',
                'slug' => 'pharmacy.verify',
                'module' => 'pharmacy',
            ],
            [
                'name' => 'Substitute Medicine',
                'slug' => 'pharmacy.substitute',
                'module' => 'pharmacy',
            ],
            [
                'name' => 'Cancel Prescription',
                'slug' => 'pharmacy.cancel',
                'module' => 'pharmacy',
            ],
            [
                'name' => 'View Medicine Stock',
                'slug' => 'stock.view',
                'module' => 'pharmacy',
            ],
            [
                'name' => 'Manage Medicine Stock',
                'slug' => 'stock.manage',
                'module' => 'pharmacy',
            ],
            [
                'name' => 'Stock Opname',
                'slug' => 'stock.opname',
                'module' => 'pharmacy',
            ],
            [
                'name' => 'Manage Supplier',
                'slug' => 'supplier.manage',
                'module' => 'pharmacy',
            ],
        ];

        $permissionIds = [];

        foreach ($permissions as $permission) {
            $record = Permission::updateOrCreate(
                [
                    'slug' => $permission['slug'],
                ],
                $permission
            );

            $permissionIds[] = $record->id;
        }

        $pharmacy = Role::query()
            ->where('slug', 'pharmacy')
            ->firstOrFail();

        $pharmacy
            ->permissions()
            ->syncWithoutDetaching($permissionIds);
    }
}