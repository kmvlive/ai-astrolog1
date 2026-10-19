<?php

namespace App\Console\Commands;

use App\Models\MaxSubscriber;
use App\Services\MaxService;
use App\Services\CalendarDataService;
use Illuminate\Console\Command;

class SendDailyCalendarsMax extends Command
{
    protected $signature = 'calendar:send-daily-max {--test= : user_id для теста}';
    protected $description = 'Утренняя рассылка календарей в MAX';

    public function handle(): int
    {
        $max = app(MaxService::class);
        $calService = app(CalendarDataService::class);
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');

        $query = MaxSubscriber::where('is_active', true)
            ->where('max_enabled', true)
            ->whereNotNull('user_id_fk')
            ->with('user.calendars');

        if ($test = $this->option('test')) {
            $query->where('user_id', $test);
        }

        $subs = $query->get();
        $this->info("Подписчиков MAX: {$subs->count()}");

        $sent = 0;

        foreach ($subs as $sub) {
            $user = $sub->user;
            if (!$user) continue;

            if (!$this->option('test')) {
                $already = \App\Models\DeliveryLog::where('event_type', 'daily_calendars_max')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', today())
                    ->where('status', 'sent')->exists();
                if ($already) {
                    $this->warn("{$sub->user_id}: уже отправлено");
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

            $ok = $max->sendCalendar($sub->user_id, $dateRu, $calendars);
            if ($ok) {
                $sub->update(['last_activity_at' => now()]);
                try {
                    \App\Models\DeliveryLog::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event_type' => 'daily_calendars_max',
                            'created_at' => now()->startOfDay(),
                        ],
                        ['status' => 'sent']
                    );
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily_calendars_max')
                        ->whereDate('created_at', now()->toDateString())
                        ->update(['status' => 'sent']);
                }
                $sent++;
                $this->info("✓ {$sub->user_id}");
            } else {
                $this->error("✗ {$sub->user_id}");
            }
        }

        $this->info("Готово. Отправлено: $sent");
        return self::SUCCESS;
    }
}
