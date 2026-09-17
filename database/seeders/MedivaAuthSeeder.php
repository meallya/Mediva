<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MedivaAuthSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | UNITS
        |--------------------------------------------------------------------------
        */

        $itUnit = Unit::updateOrCreate(
            [
                'code' => 'IT',
            ],
            [
                'name' => 'Unit Teknologi Informasi',
                'type' => 'support',
                'is_active' => true,
            ]
        );

        $poliUmum = Unit::updateOrCreate(
            [
                'code' => 'POLI-UMUM',
            ],
            [
                'name' => 'Poli Umum',
                'type' => 'medical',
                'is_active' => true,
            ]
        );

        $frontOffice = Unit::updateOrCreate(
            [
                'code' => 'FRONT-OFFICE',
            ],
            [
                'name' => 'Front Office',
                'type' => 'administration',
                'is_active' => true,
            ]
        );

        /*
|--------------------------------------------------------------------------
| UNIT PELAYANAN / POLI
|--------------------------------------------------------------------------
*/

$medicalUnits = [
    [
        'code' => 'POLI-ANAK',
        'name' => 'Poli Anak',
    ],
    [
        'code' => 'POLI-PENYAKIT-DALAM',
        'name' => 'Poli Penyakit Dalam',
    ],
    [
        'code' => 'POLI-BEDAH',
        'name' => 'Poli Bedah',
    ],
    [
        'code' => 'POLI-OBGYN',
        'name' => 'Poli Kebidanan dan Kandungan',
    ],
    [
        'code' => 'POLI-GIGI',
        'name' => 'Poli Gigi',
    ],
    [
        'code' => 'POLI-MATA',
        'name' => 'Poli Mata',
    ],
    [
        'code' => 'POLI-THT',
        'name' => 'Poli THT',
    ],
    [
        'code' => 'POLI-KULIT',
        'name' => 'Poli Kulit dan Kelamin',
    ],
    [
        'code' => 'POLI-SARAF',
        'name' => 'Poli Saraf',
    ],
    [
        'code' => 'POLI-JANTUNG',
        'name' => 'Poli Jantung',
    ],
    [
        'code' => 'POLI-PARU',
        'name' => 'Poli Paru',
    ],
    [
        'code' => 'POLI-ORTHOPEDI',
        'name' => 'Poli Orthopedi',
    ],
    [
        'code' => 'POLI-REHAB-MEDIK',
        'name' => 'Poli Rehabilitasi Medik',
    ],
    [
        'code' => 'POLI-JIWA',
        'name' => 'Poli Jiwa',
    ],
    [
        'code' => 'POLI-GIZI',
        'name' => 'Poli Gizi',
    ],
];

foreach ($medicalUnits as $medicalUnit) {
    Unit::updateOrCreate(
        [
            'code' => $medicalUnit['code'],
        ],
        [
            'name' => $medicalUnit['name'],
            'type' => 'medical',
            'is_active' => true,
        ]
    );
}

        /*
        |--------------------------------------------------------------------------
        | ROLES
        |--------------------------------------------------------------------------
        */

        $itRole = Role::updateOrCreate(
            [
                'slug' => 'it',
            ],
            [
                'name' => 'IT',
                'description' => 'Administrator sistem MEDIVA',
                'is_active' => true,
            ]
        );

        $doctorRole = Role::updateOrCreate(
            [
                'slug' => 'doctor',
            ],
            [
                'name' => 'Dokter',
                'description' => 'Pelayanan dan pemeriksaan pasien',
                'is_active' => true,
            ]
        );

        $registrationRole = Role::updateOrCreate(
            [
                'slug' => 'registration',
            ],
            [
                'name' => 'Pendaftaran',
                'description' => 'Pendaftaran pasien',
                'is_active' => true,
            ]
        );

        $administrationRole = Role::updateOrCreate(
            [
                'slug' => 'administration',
            ],
            [
                'name' => 'Administrasi',
                'description' => 'Administrasi pelayanan rumah sakit',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $permissions = [
            /*
            |--------------------------------------------------------------------------
            | SYSTEM
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Analytics Sistem',
                'slug' => 'system.analytics.view',
                'module' => 'system',
            ],

            [
                'name' => 'Lihat System Alert',
                'slug' => 'system.alert.view',
                'module' => 'system',
            ],

            [
                'name' => 'Pengaturan Sistem',
                'slug' => 'system.setting',
                'module' => 'system',
            ],

            /*
            |--------------------------------------------------------------------------
            | USER & ROLE
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Kelola User',
                'slug' => 'user.manage',
                'module' => 'user',
            ],

            [
                'name' => 'Kelola Role',
                'slug' => 'role.manage',
                'module' => 'role',
            ],

            [
                'name' => 'Kelola Permission',
                'slug' => 'permission.manage',
                'module' => 'role',
            ],

            /*
            |--------------------------------------------------------------------------
            | MASTER DATA
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Klinik',
                'slug' => 'clinic.view',
                'module' => 'master',
            ],

            [
                'name' => 'Lihat Ruangan',
                'slug' => 'room.view',
                'module' => 'master',
            ],

            [
                'name' => 'Lihat Tarif',
                'slug' => 'tariff.view',
                'module' => 'master',
            ],

            [
                'name' => 'Lihat Pegawai',
                'slug' => 'employee.view',
                'module' => 'employee',
            ],

            [
                'name' => 'Lihat Dokter',
                'slug' => 'doctor.view',
                'module' => 'doctor',
            ],

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

            /*
            |--------------------------------------------------------------------------
            | QUEUE
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Antrean',
                'slug' => 'queue.view',
                'module' => 'queue',
            ],

            [
                'name' => 'Panggil Antrean',
                'slug' => 'queue.call',
                'module' => 'queue',
            ],

            [
                'name' => 'Mulai Pelayanan Antrean',
                'slug' => 'queue.start_service',
                'module' => 'queue',
            ],

            [
                'name' => 'Selesaikan Antrean',
                'slug' => 'queue.complete',
                'module' => 'queue',
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDICAL EXAMINATION
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Pemeriksaan',
                'slug' => 'examination.view',
                'module' => 'examination',
            ],

            [
                'name' => 'Buat Pemeriksaan',
                'slug' => 'examination.create',
                'module' => 'examination',
            ],

            [
                'name' => 'Ubah Pemeriksaan',
                'slug' => 'examination.update',
                'module' => 'examination',
            ],

            [
                'name' => 'Selesaikan Pemeriksaan',
                'slug' => 'examination.complete',
                'module' => 'examination',
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDICAL RECORD
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Rekam Medis',
                'slug' => 'medical_record.view',
                'module' => 'medical_record',
            ],

            [
                'name' => 'Update Rekam Medis',
                'slug' => 'medical_record.update',
                'module' => 'medical_record',
            ],

            /*
            |--------------------------------------------------------------------------
            | PRESCRIPTION
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Resep',
                'slug' => 'prescription.view',
                'module' => 'pharmacy',
            ],

            [
                'name' => 'Buat Resep',
                'slug' => 'prescription.create',
                'module' => 'pharmacy',
            ],

            /*
            |--------------------------------------------------------------------------
            | PHARMACY
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Dispensing Obat',
                'slug' => 'pharmacy.dispense',
                'module' => 'pharmacy',
            ],

            /*
|--------------------------------------------------------------------------
| MEDICINE
|--------------------------------------------------------------------------
*/

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

            /*
            |--------------------------------------------------------------------------
            | INVENTORY
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Stok',
                'slug' => 'stock.view',
                'module' => 'inventory',
            ],

            [
                'name' => 'Kelola Stok',
                'slug' => 'stock.manage',
                'module' => 'pharmacy',
            ],

            [
                'name' => 'Adjust Stok',
                'slug' => 'stock.adjust',
                'module' => 'inventory',
            ],

            [
                'name' => 'Stok Opname',
                'slug' => 'stock.opname',
                'module' => 'inventory',
            ],

            /*
            |--------------------------------------------------------------------------
            | BILLING
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Billing',
                'slug' => 'billing.view',
                'module' => 'billing',
            ],

            [
                'name' => 'Buat Billing',
                'slug' => 'billing.create',
                'module' => 'billing',
            ],

            /*
            |--------------------------------------------------------------------------
            | REPORT
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Laporan',
                'slug' => 'report.view',
                'module' => 'report',
            ],

            /*
            |--------------------------------------------------------------------------
            | AUDIT
            |--------------------------------------------------------------------------
            */

            [
                'name' => 'Lihat Activity Log',
                'slug' => 'activity_log.view',
                'module' => 'audit',
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
        | HELPER SYNC PERMISSION
        |--------------------------------------------------------------------------
        */

        $syncPermissions = function (
            Role $role,
            array $slugs
        ): void {
            $permissionIds = Permission::query()
                ->whereIn(
                    'slug',
                    $slugs
                )
                ->pluck('id')
                ->toArray();

            $role
                ->permissions()
                ->sync(
                    $permissionIds
                );
        };

        /*
        |--------------------------------------------------------------------------
        | IT PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $syncPermissions(
            $itRole,
            [
                /*
                | SYSTEM
                */

                'system.analytics.view',
                'system.alert.view',
                'system.setting',

                /*
                | USER & ROLE
                */

                'user.manage',
                'role.manage',
                'permission.manage',

                /*
                | MASTER DATA
                */

                'employee.view',
                'doctor.view',
                'clinic.view',
                'room.view',
                'tariff.view',
                'medicine.view',

                /*
                | AUDIT
                */

                'activity_log.view',

                /*
                | PATIENT
                */

                'patient.view',

                /*
                | REGISTRATION
                */

                'registration.view',

                /*
                | QUEUE
                */

                'queue.view',

                /*
                | EXAMINATION
                |
                | IT hanya monitoring.
                */

                'examination.view',

                /*
                | BILLING / REPORT / STOCK
                */

                'billing.view',
                'report.view',
                'stock.view',
                'stock.manage',
                'stock.opname',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOCTOR PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $syncPermissions(
            $doctorRole,
            [
                /*
                | PATIENT
                */

                'patient.view',

                /*
                | REGISTRATION
                */

                'registration.view',
                'registration.start_service',
                'registration.complete_service',

                /*
                | QUEUE
                */

                'queue.view',
                'queue.call',
                'queue.start_service',
                'queue.complete',

                /*
                | MEDICAL EXAMINATION
                */

                'examination.view',
                'examination.create',
                'examination.update',
                'examination.complete',

                /*
                | MEDICAL RECORD
                */

                'medical_record.view',
                'medical_record.update',

                /*
                | PRESCRIPTION
                */

                'prescription.view',
                'prescription.create',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | REGISTRATION PERMISSIONS
        |--------------------------------------------------------------------------
        */

        $syncPermissions(
            $registrationRole,
            [
                /*
                | PATIENT
                */

                'patient.view',
                'patient.create',
                'patient.update',
                'patient.delete',

                /*
                | REGISTRATION
                */

                'registration.view',
                'registration.create',
                'registration.update',
                'registration.cancel',

                /*
                | QUEUE
                */

                'queue.view',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ADMINISTRATION PERMISSIONS
        |--------------------------------------------------------------------------
        |
        | Untuk testing multi-role.
        |
        | Administrasi hanya read-only:
        | - pasien
        | - pendaftaran
        | - antrean
        |
        |--------------------------------------------------------------------------
        */

        $syncPermissions(
            $administrationRole,
            [
                'patient.view',
                'registration.view',
                'queue.view',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ADMIN / IT EMPLOYEE
        |--------------------------------------------------------------------------
        */

        $adminEmployee = Employee::updateOrCreate(
            [
                'employee_number' => 'EMP-0001',
            ],
            [
                'name' => 'Admin MEDIVA',
                'email' => 'admin@mediva.local',
                'phone' => null,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ADMIN / IT USER
        |--------------------------------------------------------------------------
        |
        | Pencarian menggunakan email agar tidak terkena duplicate email
        | ketika seeder dijalankan ulang.
        |
        |--------------------------------------------------------------------------
        */

        $adminUser = User::updateOrCreate(
            [
                'email' => 'admin@mediva.local',
            ],
            [
                'employee_id' => $adminEmployee->id,
                'username' => 'admin',
                'name' => 'Admin MEDIVA',
                'password' => Hash::make('mediva123'),
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | ADMIN / IT ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $adminAssignment = RoleAssignment::updateOrCreate(
            [
                'user_id' => $adminUser->id,
                'role_id' => $itRole->id,
                'unit_id' => $itUnit->id,
            ],
            [
                'is_default' => true,
                'is_active' => true,
            ]
        );

        /*
        | Admin hanya boleh memiliki IT assignment aktif.
        */

        RoleAssignment::query()
            ->where(
                'user_id',
                $adminUser->id
            )
            ->where(
                'id',
                '!=',
                $adminAssignment->id
            )
            ->update([
                'is_default' => false,
                'is_active' => false,
            ]);

        /*
        |--------------------------------------------------------------------------
        | DOCTOR EMPLOYEE
        |--------------------------------------------------------------------------
        */

        $doctorEmployee = Employee::updateOrCreate(
            [
                'employee_number' => 'EMP-0002',
            ],
            [
                'name' => 'Dokter MEDIVA',
                'email' => 'doctor@mediva.local',
                'phone' => null,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOCTOR PROFILE
        |--------------------------------------------------------------------------
        |
        | Employee dokter harus memiliki record pada tabel doctors.
        |
        | Ini dibutuhkan oleh:
        |
        | User
        |   ↓ employee_id
        | Employee
        |   ↓
        | Doctor
        |
        |--------------------------------------------------------------------------
        */

        $doctorProfile = Doctor::updateOrCreate(
            [
                'employee_id' => $doctorEmployee->id,
            ],
            [
                'sip_number' => 'SIP-MEDIVA-0001',
                'specialization' => 'Dokter Umum',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOCTOR → POLI
        |--------------------------------------------------------------------------
        |
        | Dokter testing ditempatkan di Poli Umum.
        |
        |--------------------------------------------------------------------------
        */

        $doctorProfile
            ->units()
            ->sync([
                $poliUmum->id,
            ]);

        /*
        |--------------------------------------------------------------------------
        | DOCTOR USER
        |--------------------------------------------------------------------------
        */

        $doctorUser = User::updateOrCreate(
            [
                'email' => 'doctor@mediva.local',
            ],
            [
                'employee_id' => $doctorEmployee->id,
                'username' => 'doctor',
                'name' => 'Dokter MEDIVA',
                'password' => Hash::make('mediva123'),
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOCTOR ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $doctorAssignment = RoleAssignment::updateOrCreate(
            [
                'user_id' => $doctorUser->id,
                'role_id' => $doctorRole->id,
                'unit_id' => $poliUmum->id,
            ],
            [
                'is_default' => true,
                'is_active' => true,
            ]
        );

        /*
        | Doctor testing hanya memiliki Doctor assignment aktif.
        */

        RoleAssignment::query()
            ->where(
                'user_id',
                $doctorUser->id
            )
            ->where(
                'id',
                '!=',
                $doctorAssignment->id
            )
            ->update([
                'is_default' => false,
                'is_active' => false,
            ]);

        /*
        |--------------------------------------------------------------------------
        | REGISTRATION EMPLOYEE
        |--------------------------------------------------------------------------
        */

        $registrationEmployee = Employee::updateOrCreate(
            [
                'employee_number' => 'EMP-0003',
            ],
            [
                'name' => 'Petugas Pendaftaran',
                'email' => 'registration@mediva.local',
                'phone' => null,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | REGISTRATION USER
        |--------------------------------------------------------------------------
        */

        $registrationUser = User::updateOrCreate(
            [
                'email' => 'registration@mediva.local',
            ],
            [
                'employee_id' => $registrationEmployee->id,
                'username' => 'registration',
                'name' => 'Petugas Pendaftaran',
                'password' => Hash::make('mediva123'),
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | REGISTRATION ROLE 1
        |--------------------------------------------------------------------------
        |
        | Default:
        | PENDAFTARAN
        |
        |--------------------------------------------------------------------------
        */

        $registrationAssignment = RoleAssignment::updateOrCreate(
            [
                'user_id' => $registrationUser->id,
                'role_id' => $registrationRole->id,
                'unit_id' => $frontOffice->id,
            ],
            [
                'is_default' => true,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | REGISTRATION ROLE 2
        |--------------------------------------------------------------------------
        |
        | ADMINISTRASI
        |
        | Digunakan untuk testing multi-role.
        |
        |--------------------------------------------------------------------------
        */

        $administrationAssignment = RoleAssignment::updateOrCreate(
            [
                'user_id' => $registrationUser->id,
                'role_id' => $administrationRole->id,
                'unit_id' => $frontOffice->id,
            ],
            [
                'is_default' => false,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | CLEAN REGISTRATION ASSIGNMENTS
        |--------------------------------------------------------------------------
        |
        | User registration hanya mempunyai:
        |
        | 1. Pendaftaran
        | 2. Administrasi
        |
        |--------------------------------------------------------------------------
        */

        RoleAssignment::query()
            ->where(
                'user_id',
                $registrationUser->id
            )
            ->whereNotIn(
                'id',
                [
                    $registrationAssignment->id,
                    $administrationAssignment->id,
                ]
            )
            ->update([
                'is_default' => false,
                'is_active' => false,
            ]);

        /*
        |--------------------------------------------------------------------------
        | FORCE DEFAULT ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        $registrationAssignment->update([
            'is_default' => true,
            'is_active' => true,
        ]);

        $administrationAssignment->update([
            'is_default' => false,
            'is_active' => true,
        ]);
    }
}