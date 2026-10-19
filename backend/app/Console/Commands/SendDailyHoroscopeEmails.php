<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use App\Models\DailyHoroscope;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendDailyHoroscopeEmails extends Command
{
    protected $signature = 'horoscope:send-daily-emails {--test= : Отправить тестовое письмо} {--force : Игнорировать защиту от повторной отправки}';
    protected $description = 'Рассылка утренних гороскопов — сводка с выбранными тематическими типами';

    private array $signsMeta = [
        'Ari' => ['Овен', '♈', 'oven'], 'Tau' => ['Телец', '♉', 'telec'],
        'Gem' => ['Близнецы', '♊', 'bliznecy'], 'Can' => ['Рак', '♋', 'rak'],
        'Leo' => ['Лев', '♌', 'lev'], 'Vir' => ['Дева', '♍', 'deva'],
        'Lib' => ['Весы', '♎', 'vesy'], 'Sco' => ['Скорпион', '♏', 'skorpion'],
        'Sag' => ['Стрелец', '♐', 'strelec'], 'Cap' => ['Козерог', '♑', 'kozerog'],
        'Aqu' => ['Водолей', '♒', 'vodoley'], 'Pis' => ['Рыбы', '♓', 'ryby'],
    ];

    /**
     * Маппинг slug подписки → type в daily_horoscopes + эмодзи + русское имя
     * Бесплатные тематические подписки
     */
    private array $typeMapping = [
        'general'  => ['general',   '🔮', 'Общий'],
        'love'     => ['love',      '❤️',  'Любовь'],
        'career'   => ['career',    '💼', 'Карьера'],
        'finance'  => ['financial', '💰', 'Финансы'],
        'health'   => ['health',    '🌿', 'Здоровье'],
    ];

    public function handle(): int
    {
        $today = now()->toDateString();
        
        // Защита от параллельного запуска — Cache::lock на 30 минут
        if (!$this->option('test') && !$this->option('force')) {
            $lock = Cache::lock('send_daily_emails_lock_' . $today, 1800);
            if (!$lock->get()) {
                $this->warn("Команда уже выполняется или уже выполнена сегодня");
                Log::info('horoscope:send-daily-emails SKIP (locked or already sent)');
                return 0;
            }
        }
        
        // Защита от повторной отправки в тот же день
        $alreadySent = \App\Models\DeliveryLog::where('event_type', 'daily')
            ->whereDate('created_at', $today)
            ->where('status', 'sent')
            ->exists();
        if ($alreadySent && !$this->option('test') && !$this->option('force')) {
            $this->warn("Сегодня рассылка уже уходила — пропускаю");
            Cache::lock('send_daily_emails_lock_' . $today)->forceRelease();
            Log::info('horoscope:send-daily-emails SKIP (already sent today)');
            return 0;
        }
        Log::info('horoscope:send-daily-emails START', ['time' => now()->toDateTimeString(), 'test' => $this->option('test')]);
        $testEmail = $this->option('test');
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        $service = app(UniSenderService::class);

        // Ищем: активная подписка + email + хотя бы один тематический тип
        $query = User::whereNotNull('email_verified_at')
            ->whereHas('subscription', function ($q) {
                $q->where(function ($q2) {
                    $q2->where('status', 'active')
                       ->orWhere(function ($q3) {
                           $q3->where('status', 'trial')
                              ->where('trial_ends_at', '>', now());
                       });
                });
            })
            ->whereHas('channels', function ($q) {
                $q->where('slug', 'email');
            })
            ->whereHas('horoscopeTypes')
            ->with(['profile', 'horoscopeTypes']);

        if ($testEmail) {
            $query->where('email', $testEmail);
        }

        $sent = 0;
        $skipped = 0;
        
        $blogPost = BlogPost::published()->orderByDesc('published_at')->first();
        if ($blogPost) {
            $this->info("📝 В рассылку добавлена статья: «{$blogPost->title}»");
        }

        $totalCount = $query->count();
        $this->info("Найдено пользователей для рассылки: {$totalCount}");
        if ($totalCount === 0) {
            $this->warn("SQL: " . $query->toSql());
            return 0;
        }

        foreach ($query->cursor() as $user) {
            $profile = $user->profile;
            if (!$profile || (!$profile->birth_date && !$profile->zodiac_sign)) {
                $skipped++;
                continue;
            }

            if ($profile->birth_date) {
                $bd = \Carbon\Carbon::parse($profile->birth_date);
                $sign = $this->zodiacSign($bd->month, $bd->day);
            } else {
                $sign = $profile->zodiac_sign;
            }
            [$signName, $signEmoji, $signSlug] = $this->signsMeta[$sign];

            // Собираем выбранные типы пользователя, которые можем отправить
            $userTypeSlugs = $user->horoscopeTypes->pluck('slug')->toArray();
            $sections = [];

            foreach ($userTypeSlugs as $slug) {
                if (!isset($this->typeMapping[$slug])) continue;

                [$type, $emoji, $name] = $this->typeMapping[$slug];

                $horoscope = DailyHoroscope::where('date', $date)
                    ->where('zodiac_sign', $sign)
                    ->where('type', $type)
                    ->where('period', 'today')
                    ->first();

                if (!$horoscope) {
                    // Ленивая генерация
                    $content = app(\App\Services\AiService::class)
                        ->generateDailyHoroscope($sign, $signName, $date, $type, 'today');
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
                    'truncated' => $service->truncateHalf($horoscope->content),
                    'url' => "https://my.neiro-astro.ru/horoscopes/{$signSlug}?type={$type}",
                    'signSlug' => $signSlug,
                ];
            }

            if (empty($sections)) {
                $this->warn("{$user->email}: нет гороскопов для отправки");
                $skipped++;
                continue;
            }

            [$html, $text] = $service->buildDailyDigestEmail(
                $user->name,
                $signName,
                $signEmoji,
                $dateRu,
                $sections,
                $user->id,
                $blogPost
            );

            // Per-user защита от дублей
            if (!$this->option('test')) {
                $alreadySentToUser = \App\Models\DeliveryLog::where('event_type', 'daily')
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', $today)
                    ->where('status', 'sent')
                    ->exists();
                if ($alreadySentToUser) {
                    $this->warn("{$user->email}: уже отправлено сегодня — пропускаю");
                    $skipped++;
                    continue;
                }
            }

            // Создаю запись ПЕРЕД отправкой — защита от дублей
            // Используем updateOrCreate чтобы не было Unique violation при перезапуске
            if (!$this->option('test')) {
                try {
                    \App\Models\DeliveryLog::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event_type' => 'daily',
                            'created_at' => now()->startOfDay(),
                        ],
                        ['status' => 'sending']
                    );
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily')
                        ->whereDate('created_at', now()->toDateString())
                        ->update(['status' => 'sending']);
                }
            }
            
            $ok = $service->sendEmail($user->email, "✨ Ваш гороскоп на {$dateRu}", $html, $text);

            if ($ok) {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily')
                        ->whereDate('created_at', $today)
                        ->update(['status' => 'sent']);
                }
                $typesStr = implode(', ', array_column($sections, 'name'));
                $this->info("{$user->email}: отправлено ({$signName}: {$typesStr})");
                $sent++;
            } else {
                if (!$this->option('test')) {
                    \App\Models\DeliveryLog::where('user_id', $user->id)
                        ->where('event_type', 'daily')
                        ->whereDate('created_at', $today)
                        ->update(['status' => 'failed']);
                }
                $this->error("{$user->email}: ошибка отправки");
            }

            usleep(500000);
        }

        Log::info('horoscope:send-daily-emails END', ['sent' => $sent, 'skipped' => $skipped]);
        $this->info("Готово! Отправлено: {$sent}, пропущено: {$skipped}");
        return 0;
    }

    private function zodiacSign(int $month, int $day): string
    {
        $bounds = [
            1 => [['Cap', 19], ['Aqu', 31]],
            2 => [['Aqu', 18], ['Pis', 29]],
            3 => [['Pis', 20], ['Ari', 31]],
            4 => [['Ari', 19], ['Tau', 31]],
            5 => [['Tau', 20], ['Gem', 31]],
            6 => [['Gem', 20], ['Can', 31]],
            7 => [['Can', 22], ['Leo', 31]],
            8 => [['Leo', 22], ['Vir', 31]],
            9 => [['Vir', 22], ['Lib', 31]],
            10 => [['Lib', 22], ['Sco', 31]],
            11 => [['Sco', 21], ['Sag', 31]],
            12 => [['Sag', 21], ['Cap', 31]],
        ];

        foreach ($bounds[$month] as [$sign, $lastDay]) {
            if ($day <= $lastDay) return $sign;
        }
        return 'Cap';
    }
}
