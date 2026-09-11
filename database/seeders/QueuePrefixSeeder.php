<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class QueuePrefixSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            [
                'code' => 'POLI-UMUM',
                'name' => 'Poli Umum',
                'prefix' => 'PU',
            ],
            [
                'code' => 'POLI-ANAK',
                'name' => 'Poli Anak',
                'prefix' => 'PA',
            ],
            [
                'code' => 'POLI-PENYAKIT-DALAM',
                'name' => 'Poli Penyakit Dalam',
                'prefix' => 'PPD',
            ],
            [
                'code' => 'POLI-BEDAH',
                'name' => 'Poli Bedah',
                'prefix' => 'PB',
            ],
            [
                'code' => 'POLI-OBGYN',
                'name' => 'Poli Kebidanan dan Kandungan',
                'prefix' => 'PKK',
            ],
            [
                'code' => 'POLI-GIGI',
                'name' => 'Poli Gigi',
                'prefix' => 'PG',
            ],
            [
                'code' => 'POLI-MATA',
                'name' => 'Poli Mata',
                'prefix' => 'PM',
            ],
            [
                'code' => 'POLI-THT',
                'name' => 'Poli THT',
                'prefix' => 'PT',
            ],
            [
                'code' => 'POLI-KULIT',
                'name' => 'Poli Kulit dan Kelamin',
                'prefix' => 'PKL',
            ],
            [
                'code' => 'POLI-SARAF',
                'name' => 'Poli Saraf',
                'prefix' => 'PS',
            ],
            [
                'code' => 'POLI-JANTUNG',
                'name' => 'Poli Jantung',
                'prefix' => 'PJ',
            ],
            [
                'code' => 'POLI-PARU',
                'name' => 'Poli Paru',
                'prefix' => 'PP',
            ],
            [
                'code' => 'POLI-ORTHOPEDI',
                'name' => 'Poli Orthopedi',
                'prefix' => 'PO',
            ],
            [
                'code' => 'POLI-REHAB-MEDIK',
                'name' => 'Poli Rehabilitasi Medik',
                'prefix' => 'PRM',
            ],
            [
                'code' => 'POLI-JIWA',
                'name' => 'Poli Jiwa',
                'prefix' => 'PJI',
            ],
            [
                'code' => 'POLI-GIZI',
                'name' => 'Poli Gizi',
                'prefix' => 'PGZ',
            ],
            [
                'code' => 'IGD',
                'name' => 'IGD',
                'prefix' => 'IGD',
            ],
        ];

        foreach ($units as $item) {
            Unit::updateOrCreate(
                [
                    'code' => $item['code'],
                ],
                [
                    'name' => $item['name'],
                    'type' => 'medical',
                    'queue_prefix' => $item['prefix'],
                    'is_active' => true,
                ]
            );
        }
    }
}