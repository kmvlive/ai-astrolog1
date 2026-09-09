<?php

namespace App\Console\Commands;

use App\Models\Horoscope;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendPersonalHoroscopeEmails extends Command
{
    protected $signature = 'horoscope:send-personal-emails {--test= : Отправить тестовое письмо} {--force : Игнорировать защиту от дублей}';
    protected $description = 'Рассылка персональных гороскопов (отдельным письмом)';

    public function handle(): int
    {
        Log::info('horoscope:send-personal-emails START', ['time' => now()->toDateTimeString(), 'test' => $this->option('test')]);
        $testEmail = $this->option('test');
        $today = now()->toDateString();
        $date = now()->startOfDay();
        $service = app(UniSenderService::class);

        // Ищем пользователей с галочкой + заполненный профиль + есть свежий персональный гороскоп
        $query = User::where('free_personal_enabled', true)
            ->whereNotNull('email_verified_at')
            ->whereHas('profile', function ($q) {
                $q->whereNotNull('birth_date')
                  ->whereNotNull('latitude')
                  ->whereNotNull('longitude');
            })
            ->whereHas('horoscopes', function ($q) use ($date) {
                $q->where('type', 'general')
                  ->where('is_personal', true)
                  ->whereDate('created_at', $date);
            })
            ->with(['profile', 'horoscopes' => function ($q) use ($date) {
                $q->where('type', 'general')
                  ->where('is_personal', true)
                  ->whereDate('created_at', $date);
            }]);

        if ($testEmail) {
            $query->where('email', $testEmail);
        }

        $users = $query->get();
        $this->info("Найдено пользователей с персональным гороскопом: {$users->count()}");

        $sent = 0;
        $skipped = 0;

        foreach ($users as $user) {
            // Защита от дублей — Cache::lock на 24 часа
            if (!$this->option('force') && !$this->option('test')) {
                $lockKey = 'email_personal_' . $user->id . '_' . $today;
                if (!Cache::lock($lockKey, 86400)->get()) {
                    $this->line("  ⏭️ Пропуск {$user->email} (уже отправлено сегодня)");
                    $skipped++;
                    continue;
                }
            }

            // DeliveryLog проверка
            if (!$this->option('test')) {
                $alreadySent = \App\Models\DeliveryLog::where('event_type', 'personal_daily')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', $today)
                    ->where('status', 'sent')
                    ->exists();
                if ($alreadySent) {
                    $this->warn("{$user->email}: уже отправлено сегодня (DeliveryLog) — пропускаю");
                    $skipped++;
                    continue;
                }
            }

            $horoscope = $user->horoscopes->first();
            if (!$horoscope) {
                $this->warn("{$user->email}: персональный гороскоп не найден");
                $skipped++;
                continue;
            }

            [$html, $text] = $service->buildPersonalDigestEmail($user->name, $horoscope);
            $ok = $service->sendEmail($user->email, "🎁 Ваш персональный прогноз", $html, $text);

            if ($ok) {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::create([
                        'user_id' => $user->id,
                        'event_type' => 'personal_daily',
                        'status' => 'sent',
                    ]);
                }
                $this->info("{$user->email}: отправлено (персональный)");
                $sent++;
            } else {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::create([
                        'user_id' => $user->id,
                        'event_type' => 'personal_daily',
                        'status' => 'failed',
                    ]);
                    // Освобождаю lock при ошибке
                    Cache::lock('email_personal_' . $user->id . '_' . $today)->forceRelease();
                }
                $this->error("{$user->email}: ошибка отправки");
            }

            usleep(500000);
        }

        Log::info('horoscope:send-personal-emails END', ['sent' => $sent, 'skipped' => $skipped]);
        $this->info("Готово! Отправлено: {$sent}, пропущено: {$skipped}");
        return self::SUCCESS;
    }
}
