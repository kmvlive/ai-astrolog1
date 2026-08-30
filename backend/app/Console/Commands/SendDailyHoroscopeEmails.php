<?php

namespace App\Console\Commands;

use App\Models\DailyHoroscope;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Console\Command;

class SendDailyHoroscopeEmails extends Command
{
    protected $signature = 'horoscope:send-daily-emails {--test= : Отправить тестовое письмо}';
    protected $description = 'Рассылка утренних гороскопов — сводка со всеми выбранными типами';

    private array $signsMeta = [
        'Ari' => ['Овен', '♈', 'oven'], 'Tau' => ['Телец', '♉', 'telec'],
        'Gem' => ['Близнецы', '♊', 'bliznecy'], 'Can' => ['Рак', '♋', 'rak'],
        'Leo' => ['Лев', '♌', 'lev'], 'Vir' => ['Дева', '♍', 'deva'],
        'Lib' => ['Весы', '♎', 'vesy'], 'Sco' => ['Скорпион', '♏', 'skorpion'],
        'Sag' => ['Стрелец', '♐', 'strelec'], 'Cap' => ['Козерог', '♑', 'kozerog'],
        'Aqu' => ['Водолей', '♒', 'vodoley'], 'Pis' => ['Рыбы', '♓', 'ryby'],
    ];

    /**
     * Маппинг slug типа подписки → type в таблице daily_horoscopes + эмодзи + русское имя
     */
    private array $typeMapping = [
        'daily'    => ['general',   '🔮', 'Общий'],
        'love'     => ['love',      '❤️',  'Любовь'],
        'finance'  => ['financial', '💰', 'Финансы'],
    ];

    public function handle(): int
    {
        $testEmail = $this->option('test');
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        $service = app(UniSenderService::class);

        // Ищем пользователей: активная подписка + email + хотя бы один тип
        $query = User::whereHas('subscription', function ($q) {
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

        foreach ($query->cursor() as $user) {
            $profile = $user->profile;
            if (!$profile || !$profile->birth_date) {
                $skipped++;
                continue;
            }

            $bd = \Carbon\Carbon::parse($profile->birth_date);
            $sign = $this->zodiacSign($bd->month, $bd->day);
            [$signName, $signEmoji, $signSlug] = $this->signsMeta[$sign];

            // Собираем все выбранные пользователем типы, которые можем отправить
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
                $sections
            );

            $ok = $service->sendEmail($user->email, "✨ Ваш гороскоп на {$dateRu}", $html, $text);

            if ($ok) {
                $typesStr = implode(', ', array_column($sections, 'name'));
                $this->info("{$user->email}: отправлено ({$signName}: {$typesStr})");
                $sent++;
            } else {
                $this->error("{$user->email}: ошибка отправки");
            }

            usleep(500000);
        }

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
