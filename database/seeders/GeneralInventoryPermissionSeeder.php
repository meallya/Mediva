<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class GeneralInventoryPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'Lihat General Inventory',
                'slug' => 'inventory.view',
                'module' => 'inventory',
            ],
            [
                'name' => 'Kelola Master General Inventory',
                'slug' => 'inventory.manage',
                'module' => 'inventory',
            ],
            [
                'name' => 'Barang Masuk General Inventory',
                'slug' => 'inventory.stock_in',
                'module' => 'inventory',
            ],
            [
                'name' => 'Barang Keluar General Inventory',
                'slug' => 'inventory.stock_out',
                'module' => 'inventory',
            ],
            [
                'name' => 'Buat Permintaan General Inventory',
                'slug' => 'inventory.request',
                'module' => 'inventory',
            ],
            [
                'name' => 'Approve Permintaan General Inventory',
                'slug' => 'inventory.approve',
                'module' => 'inventory',
            ],
            [
                'name' => 'Distribusi General Inventory',
                'slug' => 'inventory.distribute',
                'module' => 'inventory',
            ],
            [
                'name' => 'Stock Opname General Inventory',
                'slug' => 'inventory.opname',
                'module' => 'inventory',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission,
            );
        }

        $allInventoryPermissionIds = Permission::query()
            ->whereIn(
                'slug',
                collect($permissions)->pluck('slug')->all(),
            )
            ->pluck('id')
            ->all();

        foreach (['it', 'warehouse'] as $roleSlug) {
            $role = Role::query()
                ->where('slug', $roleSlug)
                ->first();

            if ($role) {
                $role->permissions()->syncWithoutDetaching(
                    $allInventoryPermissionIds
                );
            }
        }

        $managementRole = Role::query()
            ->where('slug', 'management')
            ->first();

        if ($managementRole) {
            $viewPermissionId = Permission::query()
                ->where('slug', 'inventory.view')
                ->value('id');

            if ($viewPermissionId) {
                $managementRole
                    ->permissions()
                    ->syncWithoutDetaching([$viewPermissionId]);
            }
        }
    }
}
