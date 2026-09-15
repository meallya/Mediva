<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            MedivaAuthSeeder::class,
        ]);

        $this->call([
            BillingSeeder::class,
        ]);

        $this->call([
            ReportSeeder::class,
        ]);

        $this->call([
            GeneralInventoryPermissionSeeder::class,
            OperationalHospitalPermissionSeeder::class,
        ]);
    }
}
