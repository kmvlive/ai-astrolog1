<?php

namespace App\Console\Commands;

use App\Models\Horoscope;
use App\Models\TelegramSubscriber;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendPersonalHoroscopeTelegram extends Command
{
    protected $signature = 'horoscope:send-personal-telegram {--test= : chat_id для теста} {--force : Игнорировать защиту от дублей}';
    protected $description = 'Рассылка персональных гороскопов в Telegram (отдельным сообщением)';

    public function handle(TelegramService $telegram): int
    {
        Log::info('horoscope:send-personal-telegram START', ['time' => now()->toDateTimeString()]);
        $today = now()->toDateString();
        $date = now()->startOfDay();

        $query = TelegramSubscriber::where('is_active', true)
            ->whereNotNull('user_id')
            ->whereHas('user', function ($q) use ($date) {
                $q->where(function ($q2) {
                    $q2->where('free_personal_enabled', true)
                       ->orWhereHas('referralCycles', function ($q3) {
                           $q3->where('is_active', true)
                              ->where('ends_at', '>', now());
                       });
                })
                ->whereHas('horoscopes', function ($q2) use ($date) {
                    $q2->where('type', 'general')
                       ->where('is_personal', true)
                       ->whereDate('created_at', $date);
                });
            })
            ->with(['user.horoscopes' => function ($q) use ($date) {
                $q->where('type', 'general')
                  ->where('is_personal', true)
                  ->whereDate('created_at', $date);
            }]);

        if ($test = $this->option('test')) {
            $query->where('chat_id', $test);
        }

        $subs = $query->get();
        $this->info("Подписчиков с персональным: {$subs->count()}");

        $sent = 0;
        $skipped = 0;

        foreach ($subs as $sub) {
            $user = $sub->user;

            // Per-user защита от дублей
            if (!$this->option('test')) {
                $alreadySent = \App\Models\DeliveryLog::where('event_type', 'personal_daily_tg')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', $today)
                    ->where('status', 'sent')
                    ->exists();
                if ($alreadySent) {
                    $this->warn("{$sub->chat_id}: уже отправлено сегодня — пропускаю");
                    $skipped++;
                    continue;
                }
            }

            $horoscope = $user->horoscopes->first();
            if (!$horoscope) {
                $skipped++;
                continue;
            }

            $preview = mb_substr($horoscope->content, 0, 600);
            if (mb_strlen($horoscope->content) > 600) $preview .= '...';
            $dateRu = $horoscope->created_at->locale('ru')->isoFormat('D MMMM YYYY');
            $personalUrl = "https://my.neiro-astro.ru/horoscope/personal/{$horoscope->id}";

            $text = "🎁 <b>Персональный прогноз</b>\n";
            $text .= "<i>Только для вас · {$dateRu}</i>\n\n";
            $text .= "{$preview}\n\n";
            $text .= "📖 <a href=\"{$personalUrl}\">Читать полностью →</a>";

            $ok = $telegram->sendMessage($sub->chat_id, $text, ['disable_web_page_preview' => true]);

            if ($ok) {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event_type' => 'personal_daily_tg',
                            'created_at' => now()->startOfDay(),
                        ],
                        ['status' => 'sent', 'error_message' => null]
                    );
                }
                $this->info("✓ {$sub->chat_id}");
                $sent++;
            } else {
                $this->error("✗ {$sub->chat_id}");
            }

            usleep(500000);
        }

        $this->info("Готово. Отправлено: {$sent}, пропущено: {$skipped}");
        return self::SUCCESS;
    }
}
