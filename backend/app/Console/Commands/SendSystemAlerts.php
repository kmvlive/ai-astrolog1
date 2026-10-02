<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class SendSystemAlerts extends Command
{
    protected $signature = 'system:health-check {--no-telegram : только лог, без Telegram}';
    protected $description = 'Проверка здоровья: Redis, Python-сервис, рассылки. Алерт в Telegram при проблемах.';

    public function handle(): int
    {
        $problems = [];

        // 1. Redis
        try {
            Redis::ping();
        } catch (\Throwable $e) {
            $problems[] = '🔴 Redis недоступен: ' . $e->getMessage();
        }

        // 2. Python natal-chart сервис (пробуем оба URL: docker-сеть и host)
        $urls = array_filter([
            env('PYTHON_HEALTH_URL'),
            'http://astro-neiro-python:8000/health',
            'http://127.0.0.1:8003/health',
        ]);
        $pythonOk = false;
        foreach ($urls as $url) {
            try {
                $resp = Http::timeout(5)->get($url);
                if ($resp->successful()) {
                    $pythonOk = true;
                    $data = $resp->json();
                    if (($data['redis'] ?? '') !== 'connected') {
                        $problems[] = '🟡 Python работает, но его Redis отключён';
                    }
                    break;
                }
            } catch (\Throwable $e) {
                continue;
            }
        }
        if (!$pythonOk) {
            $problems[] = '🔴 Python-сервис натальных карт недоступен';
        }

        // 3. Рассылки: после 6 утра должны быть гороскопы, после 8 — письма
        $hour = (int) now()->format('G');
        if ($hour >= 6) {
            $recipients = DB::table('users')->where('free_personal_enabled', true)->count();
            $generated = DB::table('horoscopes')->where('type', 'general')->where('is_personal', true)->whereDate('created_at', today())->count();
            $sent = DB::table('delivery_logs')->where('event_type', 'personal_daily')->where('status', 'sent')->whereDate('created_at', today())->count();

            if ($recipients > 0 && $generated === 0) {
                $problems[] = "🔴 Персональные гороскопы сегодня НЕ сгенерированы (подписчиков: {$recipients})";
            } elseif ($recipients > 0 && $generated > 0 && $hour >= 8 && $sent === 0) {
                $problems[] = "🔴 Письма НЕ отправлены (сгенерировано: {$generated})";
            }
        }

        // 4. Ошибки доставки за сегодня
        $failed = DB::table('delivery_logs')->where('event_type', 'personal_daily')->where('status', 'failed')->whereDate('created_at', today())->count();
        if ($failed > 0) {
            $problems[] = "🟡 Ошибок доставки сегодня: {$failed}";
        }

        if (empty($problems)) {
            $this->info('✅ Система здорова');
            return self::SUCCESS;
        }

        $message = "⚠️ AI Астролог — проблемы:\n" . implode("\n", $problems);
        $this->warn($message);
        Log::error('System health check', ['problems' => $problems]);

        if (!$this->option('no-telegram')) {
            $this->sendTelegram($message);
        }
        return self::FAILURE;
    }

    private function sendTelegram(string $message): void
    {
        $token = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_ALERT_CHAT_ID', env('TELEGRAM_CHAT_ID'));
        if (!$token || !$chatId) {
            Log::error('Telegram alert не настроен: задай TELEGRAM_ALERT_CHAT_ID в .env');
            return;
        }
        try {
            Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
            ]);
        } catch (\Throwable $e) {
            Log::error('Telegram alert failed', ['error' => $e->getMessage()]);
        }
    }
}
