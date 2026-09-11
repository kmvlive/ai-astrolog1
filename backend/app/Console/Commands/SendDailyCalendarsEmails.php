<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\DeliveryLog;
use App\Services\UniSenderService;
use App\Services\CalendarDataService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class SendDailyCalendarsEmails extends Command
{
    protected $signature = 'calendar:send-daily-emails {--test= : Отправить тестовое письмо} {--force : Игнорировать защиту от повторной отправки}';
    protected $description = 'Рассылка утренних календарей';

    public function handle(): int
    {
        // Проверяем что драйвер PostgreSQL доступен
        try {
            \DB::connection()->getPdo();
        } catch (\Exception $e) {
            Log::error('calendar:send-daily-emails: DB connection failed', ['error' => $e->getMessage()]);
            $this->error("Ошибка подключения к БД: " . $e->getMessage());
            return 1;
        }

        $today = now()->toDateString();

        $alreadySent = DeliveryLog::where('event_type', 'daily_calendars')
            ->whereDate('created_at', $today)
            ->where('status', 'sent')
            ->exists();
        if ($alreadySent && !$this->option('test') && !$this->option('force')) {
            $this->warn("Сегодня рассылка календарей уже уходила");
            return 0;
        }

        $service = app(UniSenderService::class);
        $calService = app(CalendarDataService::class);
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');

        $query = User::whereNotNull('email_verified_at')
            ->whereHas('channels', function ($q) {
                $q->where('slug', 'email');
            })
            ->whereHas('calendars')
            ->with('calendars');

        if ($testEmail = $this->option('test')) {
            $query->where('email', $testEmail);
        }

        $sent = 0;
        $skipped = 0;
        $errors = 0;
        $totalCount = $query->count();

        Log::info('calendar:send-daily-emails START', [
            'test' => $this->option('test'),
            'force' => $this->option('force'),
            'total_users' => $totalCount,
        ]);
        $this->info("Начинаем рассылку для {$totalCount} пользователей...");
        $this->info("Найдено пользователей: {$totalCount}");

        foreach ($query->cursor() as $user) {
            $userCalendarSlugs = $user->calendars->pluck('slug')->toArray();
            if (empty($userCalendarSlugs)) {
                $skipped++;
                continue;
            }

            $calendars = [];
            foreach ($userCalendarSlugs as $slug) {
                $cal = $user->calendars->firstWhere('slug', $slug);
                if (!$cal) continue;
                try {
                    $info = $calService->getDayInfo($slug, $date);
                    $calendars[] = [
                        'emoji' => $cal->emoji,
                        'name' => $cal->name,
                        'blocks' => $info['blocks'],
                    ];
                } catch (\Exception $e) {
                    Log::warning("calendar:send-daily-emails: failed to get day info", [
                        'user_id' => $user->id,
                        'slug' => $slug,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            if (empty($calendars)) {
                $skipped++;
                continue;
            }

            if (!$this->option('test')) {
                $alreadySentToUser = DeliveryLog::where('user_id', $user->id)
                    ->where('event_type', 'daily_calendars')
                    ->whereDate('created_at', $today)
                    ->where('status', 'sent')
                    ->exists();
                if ($alreadySentToUser) {
                    $skipped++;
                    continue;
                }
                
                try {
                    DeliveryLog::create([
                        'user_id' => $user->id,
                        'event_type' => 'daily_calendars',
                        'status' => 'sending'
                    ]);
                } catch (QueryException $e) {
                    if (str_contains($e->getMessage(), 'duplicate key') || str_contains($e->getMessage(), 'Unique violation')) {
                        $skipped++;
                        continue;
                    }
                    throw $e;
                }
            }

            try {
                [$html, $text] = $service->buildCalendarDigestEmail($user->name, $dateRu, $calendars, $user->id);
                $ok = $service->sendEmail($user->email, "📅 Ваши календари на {$dateRu}", $html, $text);

                if ($ok) {
                    if (!$this->option('test')) {
                        DeliveryLog::where('user_id', $user->id)
                            ->where('event_type', 'daily_calendars')
                            ->whereDate('created_at', $today)
                            ->update(['status' => 'sent']);
                    }
                    $sent++;
                    $this->info("{$user->email}: отправлено");
                } else {
                    if (!$this->option('test')) {
                        DeliveryLog::where('user_id', $user->id)
                            ->where('event_type', 'daily_calendars')
                            ->whereDate('created_at', $today)
                            ->update(['status' => 'failed']);
                    }
                    $errors++;
                    $this->error("{$user->email}: ошибка отправки");
                }
            } catch (\Exception $e) {
                Log::error("calendar:send-daily-emails: exception for user {$user->id}", [
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
                $errors++;
                $this->error("{$user->email}: исключение - " . $e->getMessage());
                
                if (!$this->option('test')) {
                    try {
                        DeliveryLog::where('user_id', $user->id)
                            ->where('event_type', 'daily_calendars')
                            ->whereDate('created_at', $today)
                            ->update(['status' => 'failed']);
                    } catch (\Exception $updateError) {
                        // Ignore update errors
                    }
                }
            }
            usleep(300000);
        }

        Log::info('calendar:send-daily-emails END', [
            'sent' => $sent,
            'skipped' => $skipped,
            'errors' => $errors,
            'test' => $this->option('test'),
        ]);
        $this->info("Рассылка завершена: отправлено={$sent}, пропущено={$skipped}, ошибок={$errors}");
        $this->info("Готово! Отправлено: {$sent}, пропущено: {$skipped}, ошибок: {$errors}");
        return 0;
    }
}
