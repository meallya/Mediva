<?php

namespace App\Enums;

enum OperatingRoomUsageType: string
{
    case MEDICINE = 'medicine';
    case MEDICAL_MATERIAL = 'medical_material';
    case ASSET = 'asset';
}
