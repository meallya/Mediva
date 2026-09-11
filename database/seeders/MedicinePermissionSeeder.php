<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class MedicinePermissionSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $permissions = [
            [
                'name' => 'Lihat Master Obat',
                'slug' => 'medicine.view',
                'module' => 'medicine',
            ],

            [
                'name' => 'Tambah Master Obat',
                'slug' => 'medicine.create',
                'module' => 'medicine',
            ],

            [
                'name' => 'Ubah Master Obat',
                'slug' => 'medicine.update',
                'module' => 'medicine',
            ],

            [
                'name' => 'Hapus Master Obat',
                'slug' => 'medicine.delete',
                'module' => 'medicine',
            ],

            [
                'name' => 'Ubah Status Master Obat',
                'slug' => 'medicine.status',
                'module' => 'medicine',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                [
                    'slug' => $permission['slug'],
                ],
                $permission
            );
        }

        /*
        |--------------------------------------------------------------------------
        | IDS
        |--------------------------------------------------------------------------
        */

        $medicinePermissions =
            Permission::query()
                ->whereIn(
                    'slug',
                    [
                        'medicine.view',
                        'medicine.create',
                        'medicine.update',
                        'medicine.delete',
                        'medicine.status',
                    ]
                )
                ->pluck('id', 'slug');

        /*
        |--------------------------------------------------------------------------
        | PHARMACY
        |--------------------------------------------------------------------------
        |
        | Farmasi merupakan owner Master Medicine.
        |
        */

        $pharmacyRole =
            Role::query()
                ->where(
                    'slug',
                    'pharmacy'
                )
                ->firstOrFail();

        $pharmacyRole
            ->permissions()
            ->syncWithoutDetaching(
                $medicinePermissions
                    ->values()
                    ->toArray()
            );

        /*
        |--------------------------------------------------------------------------
        | IT
        |--------------------------------------------------------------------------
        |
        | IT hanya boleh melihat Master Medicine.
        |
        */

        $itRole =
            Role::query()
                ->where(
                    'slug',
                    'it'
                )
                ->firstOrFail();

        /*
        | Pastikan CRUD Medicine tidak dimiliki IT.
        */

        $itRole
            ->permissions()
            ->detach([
                $medicinePermissions[
                    'medicine.create'
                ],

                $medicinePermissions[
                    'medicine.update'
                ],

                $medicinePermissions[
                    'medicine.delete'
                ],

                $medicinePermissions[
                    'medicine.status'
                ],
            ]);

        /*
        | IT tetap mendapat medicine.view.
        */

        $itRole
            ->permissions()
            ->syncWithoutDetaching([
                $medicinePermissions[
                    'medicine.view'
                ],
            ]);
    }
}