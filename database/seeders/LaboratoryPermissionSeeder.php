<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class LaboratoryPermissionSeeder extends Seeder
{
    public function run(): void
    {
        Unit::updateOrCreate(
            ['code' => 'LAB'],
            [
                'name' => 'Laboratorium',
                'type' => 'medical',
                'is_active' => true,
            ],
        );

        Role::updateOrCreate(
            ['slug' => 'laboratory'],
            [
                'name' => 'Laboratorium',
                'description' => 'Pelayanan pemeriksaan laboratorium',
                'is_active' => true,
            ],
        );

        $permissions = [
            ['name' => 'Lihat Laboratorium', 'slug' => 'laboratory.view', 'module' => 'laboratory'],
            ['name' => 'Buat Permintaan Laboratorium', 'slug' => 'laboratory.create', 'module' => 'laboratory'],
            ['name' => 'Ubah Permintaan Laboratorium', 'slug' => 'laboratory.update', 'module' => 'laboratory'],
            ['name' => 'Ambil dan Terima Sampel', 'slug' => 'laboratory.collect_sample', 'module' => 'laboratory'],
            ['name' => 'Proses Pemeriksaan Laboratorium', 'slug' => 'laboratory.process', 'module' => 'laboratory'],
            ['name' => 'Input Hasil Laboratorium', 'slug' => 'laboratory.result', 'module' => 'laboratory'],
            ['name' => 'Verifikasi Hasil Laboratorium', 'slug' => 'laboratory.verify', 'module' => 'laboratory'],
            ['name' => 'Batalkan Permintaan Laboratorium', 'slug' => 'laboratory.cancel', 'module' => 'laboratory'],
            ['name' => 'Kelola Master Laboratorium', 'slug' => 'laboratory.master', 'module' => 'laboratory'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission,
            );
        }

        $allIds = Permission::query()
            ->whereIn('slug', collect($permissions)->pluck('slug')->all())
            ->pluck('id')
            ->all();

        foreach (['it', 'laboratory'] as $roleSlug) {
            $role = Role::query()->where('slug', $roleSlug)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching($allIds);
            }
        }

        $doctor = Role::query()->where('slug', 'doctor')->first();
        if ($doctor) {
            $doctorIds = Permission::query()
                ->whereIn('slug', ['laboratory.view', 'laboratory.create'])
                ->pluck('id')
                ->all();
            $doctor->permissions()->syncWithoutDetaching($doctorIds);
        }

        $management = Role::query()->where('slug', 'management')->first();
        if ($management) {
            $viewId = Permission::query()
                ->where('slug', 'laboratory.view')
                ->value('id');
            if ($viewId) {
                $management->permissions()->syncWithoutDetaching([$viewId]);
            }
        }
    }
}
