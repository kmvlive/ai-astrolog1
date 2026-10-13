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
    protected $description = 'Проверка здоровья: Redis, Python-сервис, рассылки. Алерт в Telegram при критических проблемах.';

    public function handle(): int
    {
        $redProblems = [];    // критичные — алерт в Telegram
        $yellowProblems = []; // информационные — только лог

        // 1. Redis
        try {
            Redis::ping();
        } catch (\Throwable $e) {
            $redProblems[] = '🔴 Redis недоступен: ' . $e->getMessage();
        }

        // 2. Python natal-chart сервис
        $urls = array_filter([
            env('PYTHON_HEALTH_URL'),
            env('ASTRO_SERVICE_URL', 'http://127.0.0.1:8003') . '/health',
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
                        $yellowProblems[] = '🟡 Python работает, но его Redis отключён';
                    }
                    break;
                }
            } catch (\Throwable $e) {
                continue;
            }
        }
        if (!$pythonOk) {
            $redProblems[] = '🔴 Python-сервис натальных карт недоступен';
        }

        // 3. Рассылки: после 6 утра должны быть гороскопы, после 8 — письма
        $hour = (int) now()->format('G');
        if ($hour >= 6) {
            // Считаем только тех, кто НЕ отписался
            $recipients = DB::table('users')
                ->where('free_personal_enabled', true)
                ->whereNull('unsubscribed_at')
                ->count();
            
            $generated = DB::table('horoscopes')
                ->where('type', 'general')
                ->where('is_personal', true)
                ->whereDate('created_at', today())
                ->count();
            
            $sent = DB::table('delivery_logs')
                ->where('event_type', 'personal_daily')
                ->where('status', 'sent')
                ->whereDate('created_at', today())
                ->count();

            if ($recipients > 0 && $generated === 0) {
                $redProblems[] = "🔴 Персональные гороскопы сегодня НЕ сгенерированы (подписчиков: {$recipients})";
            } elseif ($recipients > 0 && $generated > 0 && $hour >= 8 && $sent === 0) {
                $redProblems[] = "🔴 Письма НЕ отправлены (сгенерировано: {$generated})";
            }
        }

        // 4. Ошибки доставки — только критичные (не отписавшиеся)
        $failed = DB::table('delivery_logs as d')
            ->join('users as u', 'd.user_id', '=', 'u.id')
            ->where('d.event_type', 'personal_daily')
            ->where('d.status', 'failed')
            ->whereNull('u.unsubscribed_at')
            ->whereDate('d.created_at', today())
            ->count();
        
        if ($failed > 5) {  // алертим только если больше 2 ошибок
            $redProblems[] = "🔴 Критичных ошибок доставки сегодня: {$failed}";
        } elseif ($failed > 0) {
            $yellowProblems[] = "🟡 Ошибок доставки сегодня: {$failed}";
        }

        $allProblems = array_merge($redProblems, $yellowProblems);

        if (empty($allProblems)) {
            $this->info('✅ Система здорова');
            return self::SUCCESS;
        }

        // Логируем все проблемы
        foreach ($allProblems as $p) {
            $this->warn($p);
        }
        Log::error('System health check', ['problems' => $allProblems]);

        // Алерт в Telegram — только при красных проблемах
        if (!empty($redProblems) && !$this->option('no-telegram')) {
            $message = "🚨 AI Астролог — критические проблемы:\n" . implode("\n", $redProblems);
            $this->sendTelegram($message);
        }

        return empty($redProblems) ? self::SUCCESS : self::FAILURE;
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
                'parse_mode' => 'HTML',
            ]);
            Log::info('Telegram alert sent', ['chat_id' => $chatId]);
        } catch (\Throwable $e) {
            Log::error('Telegram alert failed', ['error' => $e->getMessage()]);
        }
    }
}
