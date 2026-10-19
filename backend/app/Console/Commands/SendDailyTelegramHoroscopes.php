<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use App\Models\DailyHoroscope;
use App\Models\TelegramSubscriber;
use App\Services\AiService;
use App\Services\TelegramService;
use App\Helpers\SubscriptionHelper;
use App\Services\UniSenderService;
use Illuminate\Console\Command;

class SendDailyTelegramHoroscopes extends Command
{
    protected $signature = 'horoscope:send-daily-telegram {--test= : chat_id для теста}';
    protected $description = 'Утренняя рассылка гороскопов в Telegram';

    private array $signsMeta = [
        'Ari' => ['Овен', '♈', 'oven'], 'Tau' => ['Телец', '♉', 'telec'],
        'Gem' => ['Близнецы', '♊', 'bliznecy'], 'Can' => ['Рак', '♋', 'rak'],
        'Leo' => ['Лев', '♌', 'lev'], 'Vir' => ['Дева', '♍', 'deva'],
        'Lib' => ['Весы', '♎', 'vesy'], 'Sco' => ['Скорпион', '♏', 'skorpion'],
        'Sag' => ['Стрелец', '♐', 'strelec'], 'Cap' => ['Козерог', '♑', 'kozerog'],
        'Aqu' => ['Водолей', '♒', 'vodoley'], 'Pis' => ['Рыбы', '♓', 'ryby'],
    ];

    private array $typeMapping = [
        'general'  => ['general',   '🔮', 'Общий'],
        'love'     => ['love',      '❤️', 'Любовь'],
        'career'   => ['career',    '💼', 'Карьера'],
        'finance'  => ['financial', '💰', 'Финансы'],
        'financial'=> ['financial', '💰', 'Финансы'],
        'health'   => ['health',    '🌿', 'Здоровье'],
    ];

    public function handle(): int
    {
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        $telegram = app(TelegramService::class);
        $truncator = app(UniSenderService::class);
        $ai = app(AiService::class);

        $query = TelegramSubscriber::where('is_active', true)
            ->whereNotNull('user_id')
            ->with(['user.profile', 'user.horoscopeTypes']);

        if ($test = $this->option('test')) {
            $query->where('chat_id', $test);
        }

        $subs = $query->get();
        $this->info("Подписчиков: {$subs->count()}");

        $sent = 0;
        $blogPost = BlogPost::published()->orderByDesc('published_at')->first();
        if ($blogPost) {
            $this->info("📝 В Telegram: «{$blogPost->title}»");
        }

        foreach ($subs as $sub) {
            $user = $sub->user;

            // Per-user защита от дублей
            if (!$this->option('test')) {
                $already = \App\Models\DeliveryLog::where('event_type', 'daily_tg')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', today())
                    ->where('status', 'sent')->exists();
                if ($already) {
                    $this->warn("{$sub->chat_id}: уже отправлено сегодня — пропускаю");
                    continue;
                }
            }

            $profile = $user?->profile;
            if (!$profile || !$profile->zodiac_sign) continue;

            if ($profile->birth_date) {
                $bd = \Carbon\Carbon::parse($profile->birth_date);
                $sign = $this->zodiacSign($bd->month, $bd->day);
            } else {
                $sign = $profile->zodiac_sign;
            }

            [$signName, $signEmoji, $signSlug] = $this->signsMeta[$sign] ?? ['Рак', '♋', 'rak'];

            $userTypes = $user->horoscopeTypes->pluck('slug')->toArray();
            if (!$userTypes) $userTypes = ['general'];

            $sections = [];
            foreach ($userTypes as $slug) {
                if (!isset($this->typeMapping[$slug])) continue;
                [$type, $emoji, $name] = $this->typeMapping[$slug];

                $horoscope = DailyHoroscope::where('date', $date)
                    ->where('zodiac_sign', $sign)
                    ->where('type', $type)
                    ->where('period', 'today')
                    ->first();

                if (!$horoscope) {
                    $content = $ai->generateDailyHoroscope($sign, $signName, $date, $type, 'today');
                    if (!$content) continue;
                    $horoscope = DailyHoroscope::create([
                        'date' => $date,
                        'zodiac_sign' => $sign,
                        'type' => $type,
                        'period' => 'today',
                        'content' => $content,
                    ]);
                }

                $sections[] = [
                    'emoji' => $emoji,
                    'name' => $name,
                    'truncated' => $truncator->truncateHalf($horoscope->content),
                    'url' => "https://my.neiro-astro.ru/horoscopes/{$signSlug}",
                ];
            }

            if (!$sections) continue;

            $button = SubscriptionHelper::ctaButton($user);
            $ok = $telegram->sendHoroscope($sub->chat_id, $signEmoji, $signName, $dateRu, $sections, $button);
            if ($ok) {
                $sub->update(['last_sent_at' => now()]);
                try {
                    \App\Models\DeliveryLog::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event_type' => 'daily_tg',
                            'created_at' => now()->startOfDay(),
                        ],
                        ['status' => 'sent']
                    );
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily_tg')
                        ->whereDate('created_at', now()->toDateString())
                        ->update(['status' => 'sent']);
                }
                $sent++;
                $this->info("✓ Отправлено: {$sub->chat_id} ({$signName})");
                if ($blogPost) {
                    $telegram->sendBlogPost($sub->chat_id, $blogPost);
                }
            } else {
                $this->error("✗ Ошибка: {$sub->chat_id}");
            }
        }

        $this->info("Готово. Отправлено: $sent");
        return self::SUCCESS;
    }

    private function zodiacSign(int $m, int $d): string
    {
        $bounds = [
            1 => [['Cap', 19], ['Aqu', 31]],
            2 => [['Aqu', 18], ['Pis', 29]],
            3 => [['Pis', 20], ['Ari', 31]],
            4 => [['Ari', 19], ['Tau', 30]],
            5 => [['Tau', 20], ['Gem', 31]],
            6 => [['Gem', 20], ['Can', 30]],
            7 => [['Can', 22], ['Leo', 31]],
            8 => [['Leo', 22], ['Vir', 31]],
            9 => [['Vir', 22], ['Lib', 30]],
            10 => [['Lib', 22], ['Sco', 31]],
            11 => [['Sco', 21], ['Sag', 30]],
            12 => [['Sag', 21], ['Cap', 31]],
        ];
        foreach ($bounds[$m] as [$sign, $last]) {
            if ($d <= $last) return $sign;
        }
        return 'Cap';
    }
}
