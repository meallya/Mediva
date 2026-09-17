<?php

namespace Tests\Feature\OperatingRoom;

use App\Models\OperatingRoom;
use App\Models\Surgery;
use App\Services\OperatingRoom\OperatingRoomService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class OperatingRoomServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_surgery_number_is_generated_with_daily_prefix(): void
    {
        $service = app(OperatingRoomService::class);

        $number = $service->generateSurgeryNumber();

        $this->assertStringStartsWith('OK-' . now()->format('Ymd') . '-', $number);
        $this->assertMatchesRegularExpression('/^OK-\d{8}-\d{4}$/', $number);
    }

    public function test_schedule_rejects_room_collision(): void
    {
        $room = OperatingRoom::create([
            'code' => 'OK-01',
            'name' => 'Kamar Operasi 1',
            'status' => 'available',
            'is_active' => true,
        ]);

        $first = Surgery::create([
            'surgery_number' => 'OK-' . now()->format('Ymd') . '-9001',
            'patient_id' => 1,
            'visit_id' => 1,
            'operating_room_id' => $room->id,
            'priority' => 'elective',
            'status' => 'scheduled',
            'scheduled_start_at' => now()->setTime(9, 0),
            'scheduled_end_at' => now()->setTime(11, 0),
        ]);

        $second = Surgery::create([
            'surgery_number' => 'OK-' . now()->format('Ymd') . '-9002',
            'patient_id' => 2,
            'visit_id' => 2,
            'priority' => 'elective',
            'status' => 'requested',
        ]);

        $this->expectException(ValidationException::class);

        app(OperatingRoomService::class)->schedule($second, [
            'operating_room_id' => $room->id,
            'scheduled_start_at' => now()->setTime(10, 0),
            'scheduled_end_at' => now()->setTime(12, 0),
        ]);
    }
}
