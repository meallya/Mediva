<?php

namespace Database\Seeders;

use App\Models\LaboratoryParameter;
use App\Models\LaboratoryReferenceRange;
use App\Models\LaboratorySampleType;
use App\Models\LaboratoryTestType;
use Illuminate\Database\Seeder;

class LaboratoryMasterSeeder extends Seeder
{
    public function run(): void
    {
        $edta = LaboratorySampleType::updateOrCreate(
            ['code' => 'EDTA'],
            [
                'name' => 'Darah EDTA',
                'container' => 'Tabung ungu (EDTA)',
                'description' => 'Sampel darah dengan antikoagulan EDTA.',
                'is_active' => true,
            ],
        );

        LaboratorySampleType::updateOrCreate(
            ['code' => 'SERUM'],
            [
                'name' => 'Serum',
                'container' => 'Tabung serum',
                'is_active' => true,
            ],
        );

        LaboratorySampleType::updateOrCreate(
            ['code' => 'URINE'],
            [
                'name' => 'Urine',
                'container' => 'Pot urine steril',
                'is_active' => true,
            ],
        );

        $cbc = LaboratoryTestType::updateOrCreate(
            ['code' => 'LAB-DL'],
            [
                'name' => 'Darah Lengkap',
                'category' => 'Hematologi',
                'sample_type_id' => $edta->id,
                'price' => 75000,
                'turnaround_minutes' => 60,
                'description' => 'Pemeriksaan hematologi dasar.',
                'is_active' => true,
            ],
        );

        $parameters = [
            [
                'code' => 'HB',
                'name' => 'Hemoglobin',
                'unit' => 'g/dL',
                'sort_order' => 1,
                'male_min' => 13.0,
                'male_max' => 17.0,
                'female_min' => 12.0,
                'female_max' => 15.0,
                'critical_min' => 7.0,
                'critical_max' => 20.0,
            ],
            [
                'code' => 'WBC',
                'name' => 'Leukosit',
                'unit' => '/µL',
                'sort_order' => 2,
                'male_min' => 4000,
                'male_max' => 11000,
                'female_min' => 4000,
                'female_max' => 11000,
                'critical_min' => 2000,
                'critical_max' => 30000,
            ],
            [
                'code' => 'PLT',
                'name' => 'Trombosit',
                'unit' => '/µL',
                'sort_order' => 3,
                'male_min' => 150000,
                'male_max' => 450000,
                'female_min' => 150000,
                'female_max' => 450000,
                'critical_min' => 50000,
                'critical_max' => 1000000,
            ],
        ];

        foreach ($parameters as $item) {
            $parameter = LaboratoryParameter::updateOrCreate(
                [
                    'test_type_id' => $cbc->id,
                    'code' => $item['code'],
                ],
                [
                    'name' => $item['name'],
                    'data_type' => 'numeric',
                    'unit' => $item['unit'],
                    'sort_order' => $item['sort_order'],
                    'is_active' => true,
                ],
            );

            foreach (['male', 'female'] as $gender) {
                LaboratoryReferenceRange::updateOrCreate(
                    [
                        'parameter_id' => $parameter->id,
                        'gender' => $gender,
                        'age_min_months' => null,
                        'age_max_months' => null,
                    ],
                    [
                        'min_value' => $item["{$gender}_min"],
                        'max_value' => $item["{$gender}_max"],
                        'critical_min' => $item['critical_min'],
                        'critical_max' => $item['critical_max'],
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
