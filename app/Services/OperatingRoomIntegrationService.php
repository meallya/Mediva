<?php

namespace App\Services\OperatingRoom;

use App\Models\OperatingRoomUsage;
use App\Models\Surgery;
use Illuminate\Support\Facades\Log;

class OperatingRoomIntegrationService
{
    /**
     * Integration is deliberately adapter-style because the exact current
     * MEDIVA service class names were not attached to this chat.
     * Map the method names here to your existing services once.
     */
    public function syncUsage(OperatingRoomUsage $usage): void
    {
        try {
            match ($usage->usage_type->value) {
                'medicine' => $this->callIfAvailable(
                    \App\Services\Pharmacy\PharmacyStockService::class,
                    'consumeForSurgery',
                    [$usage]
                ),
                'medical_material' => $this->callIfAvailable(
                    \App\Services\Inventory\InventoryStockService::class,
                    'consumeForSurgery',
                    [$usage]
                ),
                'asset' => $this->callIfAvailable(
                    \App\Services\Asset\AssetUsageService::class,
                    'recordSurgeryUsage',
                    [$usage]
                ),
            };
        } catch (\Throwable $e) {
            Log::warning('Operating Room usage integration pending/failed', [
                'usage_id' => $usage->id,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function finalize(Surgery $surgery): void
    {
        $this->callIfAvailable(
            \App\Services\MedicalRecord\MedicalRecordService::class,
            'appendOperatingRoomRecord',
            [$surgery]
        );

        $this->callIfAvailable(
            \App\Services\Billing\BillingService::class,
            'addOperatingRoomCharges',
            [$surgery]
        );
    }

    public function audit(string $action, Surgery $surgery, array $old = []): void
    {
        $service = \App\Services\Audit\AuditService::class;

        if (class_exists($service)) {
            app($service)->log(
                action: $action,
                module: 'operating_room',
                recordId: $surgery->id,
                oldValue: $old,
                newValue: $surgery->fresh()->toArray(),
            );
        }
    }

    private function callIfAvailable(string $class, string $method, array $arguments): void
    {
        if (! class_exists($class)) {
            return;
        }

        $instance = app($class);

        if (method_exists($instance, $method)) {
            $instance->{$method}(...$arguments);
        }
    }
}
