<?php

namespace App\Enums;

enum SurgeryPriority: string
{
    case ELECTIVE = 'elective';
    case URGENT = 'urgent';
    case EMERGENCY = 'emergency';

    public function label(): string
    {
        return match ($this) {
            self::ELECTIVE => 'Elektif',
            self::URGENT => 'Urgent',
            self::EMERGENCY => 'Emergensi',
        };
    }
}
