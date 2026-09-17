<?php

namespace App\Enums;

enum SurgeryStatus: string
{
    case REQUESTED = 'requested';
    case SCHEDULED = 'scheduled';
    case PREOP = 'preop';
    case READY = 'ready';
    case IN_PROGRESS = 'in_progress';
    case RECOVERY = 'recovery';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::REQUESTED => 'Permintaan',
            self::SCHEDULED => 'Terjadwal',
            self::PREOP => 'Pra Operasi',
            self::READY => 'Siap Operasi',
            self::IN_PROGRESS => 'Sedang Operasi',
            self::RECOVERY => 'Pemulihan',
            self::COMPLETED => 'Selesai',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::COMPLETED, self::CANCELLED], true);
    }

    public function canTransitionTo(self $next): bool
    {
        if ($this === $next) {
            return true;
        }

        return in_array($next, match ($this) {
            self::REQUESTED => [self::SCHEDULED, self::CANCELLED],
            self::SCHEDULED => [self::PREOP, self::CANCELLED],
            self::PREOP => [self::READY, self::CANCELLED],
            self::READY => [self::IN_PROGRESS, self::CANCELLED],
            self::IN_PROGRESS => [self::RECOVERY],
            self::RECOVERY => [self::COMPLETED],
            self::COMPLETED, self::CANCELLED => [],
        }, true);
    }
}
