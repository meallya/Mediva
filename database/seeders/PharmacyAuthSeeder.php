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

class PharmacyAuthSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | UNIT
        |--------------------------------------------------------------------------
        */

        $pharmacyUnit =
            Unit::updateOrCreate(
                [
                    'code' =>
                        'PHARMACY',
                ],
                [
                    'name' =>
                        'Instalasi Farmasi',

                    'type' =>
                        'support',

                    'is_active' =>
                        true,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | ROLE
        |--------------------------------------------------------------------------
        */

        $pharmacyRole =
            Role::updateOrCreate(
                [
                    'slug' =>
                        'pharmacy',
                ],
                [
                    'name' =>
                        'Farmasi',

                    'description' =>
                        'Pelayanan resep dan farmasi',

                    'is_active' =>
                        true,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $permissionIds =
            Permission::query()
                ->whereIn(
                    'slug',
                    [
                        'prescription.view',
                        'pharmacy.dispense',

                        'medicine.view',
                        'medicine.create',
                        'medicine.update',
                        'medicine.delete',
                        'medicine.status',
                    ]
                )
                ->pluck(
                    'id'
                )
                ->toArray();

        $pharmacyRole
            ->permissions()
            ->sync(
                $permissionIds
            );

        /*
        |--------------------------------------------------------------------------
        | TEST EMPLOYEE
        |--------------------------------------------------------------------------
        */

        $employee =
            Employee::updateOrCreate(
                [
                    'employee_number' =>
                        'EMP-0004',
                ],
                [
                    'name' =>
                        'Petugas Farmasi',

                    'email' =>
                        'pharmacy@mediva.local',

                    'phone' =>
                        null,

                    'is_active' =>
                        true,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | TEST USER
        |--------------------------------------------------------------------------
        */

        $user =
            User::updateOrCreate(
                [
                    'email' =>
                        'pharmacy@mediva.local',
                ],
                [
                    'employee_id' =>
                        $employee->id,

                    'username' =>
                        'pharmacy',

                    'name' =>
                        'Petugas Farmasi',

                    'password' =>
                        Hash::make(
                            'mediva123'
                        ),

                    'is_active' =>
                        true,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $assignment =
            RoleAssignment::updateOrCreate(
                [
                    'user_id' =>
                        $user->id,

                    'role_id' =>
                        $pharmacyRole->id,

                    'unit_id' =>
                        $pharmacyUnit->id,
                ],
                [
                    'is_default' =>
                        true,

                    'is_active' =>
                        true,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | CLEAN TEST USER ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        RoleAssignment::query()
            ->where(
                'user_id',
                $user->id
            )
            ->where(
                'id',
                '!=',
                $assignment->id
            )
            ->update([
                'is_default' =>
                    false,

                'is_active' =>
                    false,
            ]);
    }
}