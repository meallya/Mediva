<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OperatingRoomPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['code' => 'operating_room.view', 'name' => 'Lihat Kamar Operasi'],
            ['code' => 'operating_room.create', 'name' => 'Buat Permintaan Operasi'],
            ['code' => 'operating_room.update', 'name' => 'Ubah Data Operasi'],
            ['code' => 'operating_room.schedule', 'name' => 'Atur Jadwal Operasi'],
            ['code' => 'operating_room.team.manage', 'name' => 'Kelola Tim Operasi'],
            ['code' => 'operating_room.checklist', 'name' => 'Isi Checklist Operasi'],
            ['code' => 'operating_room.start', 'name' => 'Mulai Operasi'],
            ['code' => 'operating_room.complete', 'name' => 'Selesaikan Operasi'],
            ['code' => 'operating_room.cancel', 'name' => 'Batalkan Operasi'],
            ['code' => 'operating_room.usage', 'name' => 'Catat Pemakaian Operasi'],
            ['code' => 'operating_room.recovery', 'name' => 'Kelola Pemulihan'],
            ['code' => 'operating_room.master.manage', 'name' => 'Kelola Master Kamar Operasi'],
        ];

        /*
         * MEDIVA blueprint defines a custom active-role permission model.
         * Because the exact current permission table columns are not attached,
         * this seeder adapts to common `permissions` schemas.
         */
        foreach ($permissions as $permission) {
            if (! Schema::hasTable('permissions')) {
                return;
            }

            $row = ['name' => $permission['code']];

            if (Schema::hasColumn('permissions', 'code')) {
                $row = [
                    'code' => $permission['code'],
                    'name' => $permission['name'],
                ];
            }

            if (Schema::hasColumn('permissions', 'module')) {
                $row['module'] = 'operating_room';
            }

            $identityColumn = Schema::hasColumn('permissions', 'code') ? 'code' : 'name';
            $identityValue = $permission['code'];

            $values = $row;
            if (Schema::hasColumn('permissions', 'updated_at')) {
                $values['updated_at'] = now();
            }
            if (Schema::hasColumn('permissions', 'created_at')) {
                $values['created_at'] = now();
            }

            DB::table('permissions')->updateOrInsert(
                [$identityColumn => $identityValue],
                $values
            );
        }
    }
}
