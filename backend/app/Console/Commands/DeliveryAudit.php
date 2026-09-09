<?php

namespace App\Console\Commands;

use App\Models\DeliveryLog;
use App\Services\TelegramService;
use Illuminate\Console\Command;

class DeliveryAudit extends Command
{
    protected $signature = 'horoscope:delivery-audit';
    protected $description = 'Аудит доставки: дослать недоотправленное + алерт при ошибках';

    public function handle(TelegramService $telegram): int
    {
        $this->info("=== Аудит доставки " . now()->toDateTimeString() . " ===");

        // Досылаем всё, что не ушло утром (per-user защита не даст дублей)
        $this->call('horoscope:send-daily-emails', ['--force' => true]);
        $this->call('horoscope:send-daily-telegram');
        $this->call('horoscope:send-personal-emails', ['--force' => true]);
        $this->call('horoscope:send-personal-telegram', ['--force' => true]);

        $failed = DeliveryLog::whereDate('created_at', today())
            ->where('status', 'failed')->count();
        $sent = DeliveryLog::whereDate('created_at', today())
            ->where('status', 'sent')->count();

        $this->info("Отправлено сегодня: {$sent}, ошибок: {$failed}");

        if ($failed > 0) {
            $telegram->sendMessage(
                env('TELEGRAM_ADMIN_CHAT_ID', '235857047'),
                "⚠️ <b>Аудит рассылок:</b> {$failed} ошибок доставки сегодня.\nОтправлено: {$sent}.\nПроверьте DeliveryLog в админке."
            );
            $this->warn("⚠️ Алерт отправлен админу");
        } else {
            $telegram->sendMessage(
                env('TELEGRAM_ADMIN_CHAT_ID', '235857047'),
                "✅ <b>Аудит рассылок:</b> все {$sent} доставок успешны."
            );
            $this->info("✓ Все рассылки доставлены");
        }

        return self::SUCCESS;
    }
}
