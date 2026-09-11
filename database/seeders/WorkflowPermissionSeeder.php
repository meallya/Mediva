<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class WorkflowPermissionSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $permissions = [
            /*
            |--------------------------------------------------------------------------
            | PATIENT
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Pasien',
                'slug' => 'patient.view',
                'module' => 'patient',
            ],

            [
                'name' => 'Tambah Pasien',
                'slug' => 'patient.create',
                'module' => 'patient',
            ],

            [
                'name' => 'Ubah Pasien',
                'slug' => 'patient.update',
                'module' => 'patient',
            ],

            [
                'name' => 'Hapus Pasien',
                'slug' => 'patient.delete',
                'module' => 'patient',
            ],

            /*
            |--------------------------------------------------------------------------
            | REGISTRATION
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Pendaftaran',
                'slug' => 'registration.view',
                'module' => 'registration',
            ],

            [
                'name' => 'Tambah Pendaftaran',
                'slug' => 'registration.create',
                'module' => 'registration',
            ],

            [
                'name' => 'Ubah Pendaftaran',
                'slug' => 'registration.update',
                'module' => 'registration',
            ],

            [
                'name' => 'Batalkan Pendaftaran',
                'slug' => 'registration.cancel',
                'module' => 'registration',
            ],

            [
                'name' => 'Mulai Pelayanan',
                'slug' => 'registration.start_service',
                'module' => 'registration',
            ],

            [
                'name' => 'Selesaikan Pelayanan',
                'slug' => 'registration.complete_service',
                'module' => 'registration',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE / UPDATE PERMISSIONS
        |--------------------------------------------------------------------------
        */

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
        | GET ROLES
        |--------------------------------------------------------------------------
        |
        | Slug sesuai database MEDIVA:
        |
        | IT          = it
        | Dokter      = doctor
        | Pendaftaran = registration
        |
        */

        $itRole = Role::where(
            'slug',
            'it'
        )->firstOrFail();

        $doctorRole = Role::where(
            'slug',
            'doctor'
        )->firstOrFail();

        $registrationRole = Role::where(
            'slug',
            'registration'
        )->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | WORKFLOW PERMISSIONS
        |--------------------------------------------------------------------------
        |
        | Kita hanya reset permission Patient + Registration.
        |
        | Permission module lain tidak disentuh.
        |
        */

        $workflowSlugs = [
            'patient.view',
            'patient.create',
            'patient.update',
            'patient.delete',

            'registration.view',
            'registration.create',
            'registration.update',
            'registration.cancel',
            'registration.start_service',
            'registration.complete_service',
        ];

        $workflowPermissionIds =
            Permission::whereIn(
                'slug',
                $workflowSlugs
            )
                ->pluck('id')
                ->toArray();

        /*
        |--------------------------------------------------------------------------
        | RESET WORKFLOW PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $itRole
            ->permissions()
            ->detach(
                $workflowPermissionIds
            );

        $doctorRole
            ->permissions()
            ->detach(
                $workflowPermissionIds
            );

        $registrationRole
            ->permissions()
            ->detach(
                $workflowPermissionIds
            );

        /*
        |--------------------------------------------------------------------------
        | IT
        |--------------------------------------------------------------------------
        |
        | Hanya melihat data pasien dan pendaftaran.
        | Tidak melakukan aktivitas operasional.
        |
        */

        $this->givePermissions(
            $itRole,
            [
                'patient.view',

                'registration.view',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | PENDAFTARAN
        |--------------------------------------------------------------------------
        |
        | Mengelola data pasien dan mendaftarkan pasien
        | agar dapat dilayani dokter.
        |
        */

        $this->givePermissions(
            $registrationRole,
            [
                'patient.view',
                'patient.create',
                'patient.update',

                'registration.view',
                'registration.create',
                'registration.update',
                'registration.cancel',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOKTER
        |--------------------------------------------------------------------------
        |
        | Melihat pasien yang telah didaftarkan,
        | kemudian memulai dan menyelesaikan pelayanan.
        |
        */

        $this->givePermissions(
            $doctorRole,
            [
                'patient.view',

                'registration.view',
                'registration.start_service',
                'registration.complete_service',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GIVE PERMISSIONS
    |--------------------------------------------------------------------------
    */

    private function givePermissions(
        Role $role,
        array $slugs
    ): void {
        $permissionIds =
            Permission::whereIn(
                'slug',
                $slugs
            )
                ->pluck('id')
                ->toArray();

        $role
            ->permissions()
            ->syncWithoutDetaching(
                $permissionIds
            );
    }
}