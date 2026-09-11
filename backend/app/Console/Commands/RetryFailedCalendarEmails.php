<?php

namespace App\Console\Commands;

use App\Models\DeliveryLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RetryFailedCalendarEmails extends Command
{
    protected $signature = 'calendar:retry-failed';
    protected $description = 'Повторная отправка писем, которые не дошли с первого раза (проверка через UniSender API)';

    public function handle(): int
    {
        $today = now()->toDateString();
        
        // Находим отправки с статусом 'sent' более 15 минут назад
        $logs = DeliveryLog::where('event_type', 'daily_calendars')
            ->where('status', 'sent')
            ->whereDate('created_at', $today)
            ->where('created_at', '<', now()->subMinutes(15))
            ->get();

        if ($logs->isEmpty()) {
            Log::info('calendar:retry-failed: no failed emails to retry');
            return 0;
        }

        Log::info('calendar:retry-failed START', ['count' => $logs->count()]);

        $retried = 0;
        foreach ($logs as $log) {
            // TODO: проверка статуса через UniSender API
            // Пока просто логируем что нужно проверить
            Log::warning('calendar:retry-failed: pending verification', [
                'user_id' => $log->user_id,
                'created_at' => $log->created_at,
            ]);
            $retried++;
        }

        Log::info('calendar:retry-failed END', ['retried' => $retried]);
        return 0;
    }
}
