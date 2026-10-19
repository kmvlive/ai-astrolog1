<?php

namespace App\Console\Commands;

use App\Models\TelegramSubscriber;
use App\Services\TelegramService;
use App\Services\CalendarDataService;
use Illuminate\Console\Command;

class SendDailyCalendarsTelegram extends Command
{
    protected $signature = 'calendar:send-daily-telegram {--test= : chat_id для теста}';
    protected $description = 'Утренняя рассылка календарей в Telegram';

    public function handle(): int
    {
        $telegram = app(TelegramService::class);
        $calService = app(CalendarDataService::class);
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');

        $query = TelegramSubscriber::where('is_active', true)
            ->whereNotNull('user_id')
            ->with('user.calendars');

        if ($test = $this->option('test')) {
            $query->where('chat_id', $test);
        }

        $subs = $query->get();
        $this->info("Подписчиков: {$subs->count()}");

        $sent = 0;

        foreach ($subs as $sub) {
            $user = $sub->user;
            if (!$user) continue;

            if (!$this->option('test')) {
                $already = \App\Models\DeliveryLog::where('event_type', 'daily_calendars_tg')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', today())
                    ->where('status', 'sent')->exists();
                if ($already) {
                    $this->warn("{$sub->chat_id}: уже отправлено");
                    continue;
                }
            }

            $calendars = [];
            foreach ($user->calendars as $cal) {
                $info = $calService->getDayInfo($cal->slug, $date);
                $calendars[] = [
                    'emoji' => $cal->emoji,
                    'name' => $cal->name,
                    'blocks' => $info['blocks'],
                ];
            }

            if (empty($calendars)) continue;

            $ok = $telegram->sendCalendar($sub->chat_id, $dateRu, $calendars);
            if ($ok) {
                $sub->update(['last_sent_at' => now()]);
                try {
                    \App\Models\DeliveryLog::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event_type' => 'daily_calendars_tg',
                            'created_at' => now()->startOfDay(),
                        ],
                        ['status' => 'sent']
                    );
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily_calendars_tg')
                        ->whereDate('created_at', now()->toDateString())
                        ->update(['status' => 'sent']);
                }
                $sent++;
                $this->info("✓ {$sub->chat_id}");
            } else {
                // Записываем фейл для последующего ретрая
                try {
                    \App\Models\DeliveryLog::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event_type' => 'daily_calendars_tg',
                            'created_at' => now()->startOfDay(),
                        ],
                        ['status' => 'failed']
                    );
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily_calendars_tg')
                        ->whereDate('created_at', now()->toDateString())
                        ->update(['status' => 'failed']);
                }
                $this->error("✗ {$sub->chat_id}");
            }
        }

        $this->info("Готово. Отправлено: $sent");
        return self::SUCCESS;
    }
}
