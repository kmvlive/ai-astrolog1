<?php

namespace App\Console\Commands;

use App\Models\DeliveryLog;
use App\Models\User;
use App\Services\UniSenderService;
use App\Services\CalendarDataService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RetryFailedCalendarEmails extends Command
{
    protected $signature = 'calendar:retry-failed {--limit=50 : Максимум записей за запуск}';
    protected $description = 'Повторная отправка писем с фейлом (до 3 попыток, раз в 15+ мин)';

    public function handle(): int
    {
        $lock = Cache::lock('calendar-retry-failed', 300);
        if (!$lock->get()) {
            $this->warn('Уже запущен другой процесс retry-failed');
            return 0;
        }

        try {
            return $this->process();
        } finally {
            $lock->release();
        }
    }

    private function process(): int
    {
        $limit = (int) $this->option('limit');

        // Фейлы за сутки, attempts < 3, created_at < 15 мин назад (email + telegram)
        $logs = DeliveryLog::whereIn('event_type', ['daily_calendars', 'daily_calendars_tg'])
            ->where('status', 'failed')
            ->where('attempts', '<', 3)
            ->where('created_at', '>', now()->subDay())
            ->where('created_at', '<', now()->subMinutes(15))
            ->limit($limit)
            ->lockForUpdate()
            ->get();

        if ($logs->isEmpty()) {
            Log::info('calendar:retry-failed: nothing to retry');
            $this->info('Нет фейлов для повтора');
            return 0;
        }

        $service = app(UniSenderService::class);
        $calService = app(CalendarDataService::class);
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');

        Log::info('calendar:retry-failed START', ['count' => $logs->count()]);
        $this->info("Найдено {$logs->count()} фейлов для повтора");

        $sent = 0;
        $failedAgain = 0;
        $dead = 0;
        $skipped = 0;

        foreach ($logs as $log) {
            // Инкремент attempts сразу
            $log->attempts += 1;
            $log->last_retry_at = now();
            $log->save();

            // Пользователь должен быть жив и иметь email + календари
            $user = User::with('calendars')->find($log->user_id);
            if (!$user || !$user->email) {
                $log->status = 'dead';
                $log->error_message = 'user not found or no email';
                $log->save();
                $dead++;
                continue;
            }

            $slugs = $user->calendars->pluck('slug')->toArray();
            if (empty($slugs)) {
                $log->status = 'dead';
                $log->error_message = 'user has no calendars';
                $log->save();
                $dead++;
                continue;
            }

            // Собираем контент заново (актуальные данные дня)
            $calendars = [];
            foreach ($slugs as $slug) {
                $cal = $user->calendars->firstWhere('slug', $slug);
                if (!$cal) continue;
                try {
                    $info = $calService->getDayInfo($slug, $date);
                    $calendars[] = [
                        'emoji' => $cal->emoji,
                        'name' => $cal->name,
                        'blocks' => $info['blocks'],
                    ];
                } catch (\Throwable $e) {
                    Log::warning('retry-failed: calendar fetch failed', [
                        'user_id' => $user->id, 'slug' => $slug, 'err' => $e->getMessage()
                    ]);
                }
            }

            if (empty($calendars)) {
                $log->status = 'dead';
                $log->error_message = 'no calendar data available';
                $log->save();
                $dead++;
                continue;
            }

            try {
                // Выбираем канал отправки
                if ($log->event_type === 'daily_calendars_tg') {
                    // Telegram
                    $tgService = app(\App\Services\TelegramService::class);
                    $sub = \App\Models\TelegramSubscriber::where('user_id', $user->id)
                        ->where('is_active', true)
                        ->first();
                    if (!$sub) {
                        $log->status = 'dead';
                        $log->error_message = 'no active telegram subscriber';
                        $log->save();
                        $dead++;
                        continue;
                    }
                    $ok = $tgService->sendCalendar($sub->chat_id, $dateRu, $calendars);
                } else {
                    // Email
                    [$html, $text] = $service->buildCalendarDigestEmail(
                        $user->name, $dateRu, $calendars, $user->id
                    );
                    $ok = $service->sendEmail(
                        $user->email,
                        "📅 Ваши календари на {$dateRu} (повтор)",
                        $html, $text
                    );
                }

                if ($ok) {
                    $log->status = 'sent';
                    $log->sent_at = now();
                    $log->error_message = null;
                    $log->save();
                    $sent++;
                    $this->info("✓ #{$log->id} user={$user->id} email={$user->email} → sent (attempt {$log->attempts})");
                } else {
                    if ($log->attempts >= 3) {
                        $log->status = 'dead';
                        $log->error_message = 'max attempts reached';
                        $dead++;
                        $this->warn("✗ #{$log->id} user={$user->id} → dead (attempts={$log->attempts})");
                    } else {
                        $log->error_message = 'sendEmail returned false';
                        $failedAgain++;
                        $this->warn("~ #{$log->id} user={$user->id} → failed again (attempt {$log->attempts})");
                    }
                    $log->save();
                }
            } catch (\Throwable $e) {
                $log->error_message = mb_substr($e->getMessage(), 0, 500);
                if ($log->attempts >= 3) {
                    $log->status = 'dead';
                    $dead++;
                } else {
                    $failedAgain++;
                }
                $log->save();
                $this->error("✗ #{$log->id} exception: " . $e->getMessage());
                Log::error('retry-failed: exception', [
                    'log_id' => $log->id, 'user_id' => $user->id, 'err' => $e->getMessage()
                ]);
            }

            usleep(300000); // 300ms между отправками, не спамить UniSender
        }

        Log::info('calendar:retry-failed END', compact('sent', 'failedAgain', 'dead', 'skipped'));
        $this->info("Готово: sent={$sent}, failed_again={$failedAgain}, dead={$dead}, skipped={$skipped}");
        return 0;
    }
}
