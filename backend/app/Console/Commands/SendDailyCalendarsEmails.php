<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\UniSenderService;
use App\Services\CalendarDataService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendDailyCalendarsEmails extends Command
{
    protected $signature = 'calendar:send-daily-emails {--test= : Отправить тестовое письмо} {--force : Игнорировать защиту от повторной отправки}';
    protected $description = 'Рассылка утренних календарей';

    public function handle(): int
    {
        $today = now()->toDateString();

        if (!$this->option('test') && !$this->option('force')) {
            $lock = Cache::lock('send_daily_calendars_emails_lock_' . $today, 1800);
            if (!$lock->get()) {
                $this->warn("Команда уже выполняется или уже выполнена сегодня");
                return 0;
            }
        }

        $alreadySent = \App\Models\DeliveryLog::where('event_type', 'daily_calendars')
            ->whereDate('created_at', $today)
            ->where('status', 'sent')
            ->exists();
        if ($alreadySent && !$this->option('test') && !$this->option('force')) {
            $this->warn("Сегодня рассылка календарей уже уходила");
            Cache::lock('send_daily_calendars_emails_lock_' . $today)->forceRelease();
            return 0;
        }

        Log::info('calendar:send-daily-emails START', ['test' => $this->option('test')]);
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
        $totalCount = $query->count();
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
                $info = $calService->getDayInfo($slug, $date);
                $calendars[] = [
                    'emoji' => $cal->emoji,
                    'name' => $cal->name,
                    'blocks' => $info['blocks'],
                ];
            }

            if (empty($calendars)) {
                $skipped++;
                continue;
            }

            if (!$this->option('test')) {
                $alreadySentToUser = \App\Models\DeliveryLog::where('event_type', 'daily_calendars')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', $today)
                    ->where('status', 'sent')
                    ->exists();
                if ($alreadySentToUser) {
                    $skipped++;
                    continue;
                }
                \App\Models\DeliveryLog::create(['user_id' => $user->id, 'event_type' => 'daily_calendars', 'status' => 'sending']);
            }

            [$html, $text] = $service->buildCalendarDigestEmail($user->name, $dateRu, $calendars, $user->id);
            $ok = $service->sendEmail($user->email, "📅 Ваши календари на {$dateRu}", $html, $text);

            if ($ok) {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily_calendars')
                        ->whereDate('created_at', $today)
                        ->update(['status' => 'sent']);
                }
                $sent++;
                $this->info("{$user->email}: отправлено");
            } else {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily_calendars')
                        ->whereDate('created_at', $today)
                        ->update(['status' => 'failed']);
                }
                $this->error("{$user->email}: ошибка");
            }
            usleep(300000);
        }

        Log::info('calendar:send-daily-emails END', ['sent' => $sent, 'skipped' => $skipped]);
        $this->info("Готово! Отправлено: {$sent}, пропущено: {$skipped}");
        return 0;
    }
}
