<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ReportSeeder extends Seeder
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
                'name' => 'Lihat Laporan',
                'slug' => 'report.view',
                'module' => 'report',
            ],
            [
                'name' => 'Export Laporan',
                'slug' => 'report.export',
                'module' => 'report',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission,
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MANAGEMENT ROLE
        |--------------------------------------------------------------------------
        */

        $managementUnit = Unit::updateOrCreate(
            ['code' => 'MANAGEMENT'],
            [
                'name' => 'Manajemen Rumah Sakit',
                'type' => 'management',
                'is_active' => true,
            ],
        );

        $managementRole = Role::updateOrCreate(
            ['slug' => 'management'],
            [
                'name' => 'Manajemen',
                'description' => 'Monitoring operasional, pendapatan, farmasi, dan laporan manajemen.',
                'is_active' => true,
            ],
        );

        $permissionIds = Permission::query()
            ->whereIn('slug', [
                'report.view',
                'report.export',
            ])
            ->pluck('id')
            ->all();

        $managementRole->permissions()->syncWithoutDetaching($permissionIds);

        /*
        |--------------------------------------------------------------------------
        | IT + FINANCE BOLEH MELIHAT / EXPORT REPORT
        |--------------------------------------------------------------------------
        */

        Role::query()
            ->whereIn('slug', ['it', 'finance'])
            ->get()
            ->each(function (Role $role) use ($permissionIds) {
                $role->permissions()->syncWithoutDetaching($permissionIds);
            });

        /*
        |--------------------------------------------------------------------------
        | TEST USER MANAGEMENT
        |--------------------------------------------------------------------------
        */

        $employee = Employee::updateOrCreate(
            ['employee_number' => 'EMP-MGT-0001'],
            [
                'name' => 'Manajemen MEDIVA',
                'email' => 'management@mediva.local',
                'phone' => null,
                'is_active' => true,
            ],
        );

        $user = User::updateOrCreate(
            ['email' => 'management@mediva.local'],
            [
                'employee_id' => $employee->id,
                'username' => 'management',
                'name' => 'Manajemen MEDIVA',
                'password' => Hash::make('mediva123'),
                'is_active' => true,
            ],
        );

        $assignment = RoleAssignment::updateOrCreate(
            [
                'user_id' => $user->id,
                'role_id' => $managementRole->id,
                'unit_id' => $managementUnit->id,
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
    }
}
