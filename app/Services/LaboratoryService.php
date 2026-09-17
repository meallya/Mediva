<?php

namespace App\Services;

use App\Models\LaboratoryOrder;
use App\Models\LaboratoryParameter;
use App\Models\LaboratoryReferenceRange;
use App\Models\LaboratorySpecimen;
use App\Models\Patient;
use Carbon\CarbonInterface;

class LaboratoryService
{
    public function newLabNumber(): string
    {
        $prefix = 'LAB-' . now()->format('Ymd');
        $sequence = LaboratoryOrder::query()
            ->where('lab_number', 'like', $prefix . '-%')
            ->count() + 1;

        do {
            $number = sprintf('%s-%04d', $prefix, $sequence);
            $sequence++;
        } while (LaboratoryOrder::query()->where('lab_number', $number)->exists());

        return $number;
    }

    public function newSpecimenNumber(): string
    {
        $prefix = 'SPC-' . now()->format('Ymd');
        $sequence = LaboratorySpecimen::query()
            ->where('specimen_number', 'like', $prefix . '-%')
            ->count() + 1;

        do {
            $number = sprintf('%s-%04d', $prefix, $sequence);
            $sequence++;
        } while (LaboratorySpecimen::query()->where('specimen_number', $number)->exists());

        return $number;
    }

    public function resolveReferenceRange(
        LaboratoryParameter $parameter,
        Patient $patient,
        ?CarbonInterface $referenceDate = null,
    ): ?LaboratoryReferenceRange {
        $referenceDate ??= now();

        $ageMonths = $patient->date_of_birth
            ? $patient->date_of_birth->diffInMonths($referenceDate)
            : null;

        $ranges = $parameter->referenceRanges()
            ->where('is_active', true)
            ->where(function ($query) use ($patient) {
                $query->where('gender', 'all')
                    ->orWhere('gender', $patient->gender);
            })
            ->get();

        return $ranges
            ->filter(function (LaboratoryReferenceRange $range) use ($ageMonths) {
                if ($ageMonths === null) {
                    return $range->age_min_months === null
                        && $range->age_max_months === null;
                }

                if (
                    $range->age_min_months !== null
                    && $ageMonths < $range->age_min_months
                ) {
                    return false;
                }

                if (
                    $range->age_max_months !== null
                    && $ageMonths > $range->age_max_months
                ) {
                    return false;
                }

                return true;
            })
            ->sortBy(function (LaboratoryReferenceRange $range) use ($patient) {
                $score = 100;

                if ($range->gender === $patient->gender) {
                    $score -= 30;
                }

                if ($range->age_min_months !== null) {
                    $score -= 10;
                }

                if ($range->age_max_months !== null) {
                    $score -= 10;
                }

                return $score;
            })
            ->first();
    }

    public function determineFlag(
        ?float $numericValue,
        ?LaboratoryReferenceRange $range,
        string $dataType,
        ?string $manualFlag = null,
    ): string {
        $allowed = ['normal', 'low', 'high', 'critical', 'abnormal'];

        if ($manualFlag && in_array($manualFlag, $allowed, true)) {
            return $manualFlag;
        }

        if ($dataType !== 'numeric' || $numericValue === null) {
            return 'normal';
        }

        if (!$range) {
            return 'normal';
        }

        if (
            $range->critical_min !== null
            && $numericValue <= (float) $range->critical_min
        ) {
            return 'critical';
        }

        if (
            $range->critical_max !== null
            && $numericValue >= (float) $range->critical_max
        ) {
            return 'critical';
        }

        if (
            $range->min_value !== null
            && $numericValue < (float) $range->min_value
        ) {
            return 'low';
        }

        if (
            $range->max_value !== null
            && $numericValue > (float) $range->max_value
        ) {
            return 'high';
        }

        return 'normal';
    }
}
