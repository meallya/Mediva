<?php

namespace Tests\Unit;

use App\Models\LaboratoryReferenceRange;
use App\Services\LaboratoryService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LaboratoryServiceTest extends TestCase
{
    #[Test]
    public function it_marks_numeric_results_against_reference_range(): void
    {
        $service = app(LaboratoryService::class);

        $range = new LaboratoryReferenceRange([
            'min_value' => 12,
            'max_value' => 15,
            'critical_min' => 7,
            'critical_max' => 20,
        ]);

        $this->assertSame('normal', $service->determineFlag(13.2, $range, 'numeric'));
        $this->assertSame('low', $service->determineFlag(10, $range, 'numeric'));
        $this->assertSame('high', $service->determineFlag(17, $range, 'numeric'));
        $this->assertSame('critical', $service->determineFlag(6.5, $range, 'numeric'));
        $this->assertSame('critical', $service->determineFlag(21, $range, 'numeric'));
    }

    #[Test]
    public function text_results_can_use_manual_abnormal_flag(): void
    {
        $service = app(LaboratoryService::class);

        $this->assertSame(
            'abnormal',
            $service->determineFlag(null, null, 'text', 'abnormal'),
        );
    }
}
