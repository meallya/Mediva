<?php

namespace App\Enums;

enum FastingStatus: string
{
    case NOT_REQUIRED = 'not_required';
    case NOT_STARTED = 'not_started';
    case IN_PROGRESS = 'in_progress';
    case ADEQUATE = 'adequate';
    case NOT_ADEQUATE = 'not_adequate';

    public function label(): string
    {
        return match ($this) {
            self::NOT_REQUIRED => 'Tidak Diperlukan',
            self::NOT_STARTED => 'Belum Mulai',
            self::IN_PROGRESS => 'Sedang Puasa',
            self::ADEQUATE => 'Adekuat',
            self::NOT_ADEQUATE => 'Belum Adekuat',
        };
    }
}
