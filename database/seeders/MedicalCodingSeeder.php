<?php

namespace Database\Seeders;

use App\Models\Icd10Code;
use App\Models\Icd9cmCode;
use Illuminate\Database\Seeder;

class MedicalCodingSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ICD-10 TEST DATA
        |--------------------------------------------------------------------------
        |
        | Ini data TEST untuk pengujian fitur MEDIVA.
        | Bukan master ICD produksi.
        |
        */

        $icd10Codes = [
            [
                'code' => 'TEST10-001',
                'description' => 'Diagnosis uji utama',
                'category' => 'TEST',
            ],
            [
                'code' => 'TEST10-002',
                'description' => 'Diagnosis uji sekunder',
                'category' => 'TEST',
            ],
            [
                'code' => 'TEST10-003',
                'description' => 'Diagnosis uji demam',
                'category' => 'TEST',
            ],
        ];

        foreach ($icd10Codes as $code) {
            Icd10Code::updateOrCreate(
                [
                    'code' => $code['code'],
                ],
                [
                    'description' =>
                        $code['description'],

                    'category' =>
                        $code['category'],

                    'is_active' =>
                        true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ICD-9-CM TEST DATA
        |--------------------------------------------------------------------------
        */

        $icd9cmCodes = [
            [
                'code' => 'TEST9-001',
                'description' => 'Tindakan uji pemeriksaan',
                'category' => 'TEST',
            ],
            [
                'code' => 'TEST9-002',
                'description' => 'Tindakan uji pelayanan',
                'category' => 'TEST',
            ],
            [
                'code' => 'TEST9-003',
                'description' => 'Tindakan uji observasi',
                'category' => 'TEST',
            ],
        ];

        foreach ($icd9cmCodes as $code) {
            Icd9cmCode::updateOrCreate(
                [
                    'code' => $code['code'],
                ],
                [
                    'description' =>
                        $code['description'],

                    'category' =>
                        $code['category'],

                    'is_active' =>
                        true,
                ]
            );
        }
    }
}