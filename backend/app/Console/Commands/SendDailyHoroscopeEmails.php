<?php

namespace App\Console\Commands;

use App\Models\DailyHoroscope;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Console\Command;

class SendDailyHoroscopeEmails extends Command
{
    protected $signature = 'horoscope:send-daily-emails {--test= : Отправить тестовое письмо}';
    protected $description = 'Рассылка утренних гороскопов по новой архитектуре подписок';

    private array $signsMeta = [
        'Ari' => ['Овен', '♈'], 'Tau' => ['Телец', '♉'], 'Gem' => ['Близнецы', '♊'],
        'Can' => ['Рак', '♋'], 'Leo' => ['Лев', '♌'], 'Vir' => ['Дева', '♍'],
        'Lib' => ['Весы', '♎'], 'Sco' => ['Скорпион', '♏'], 'Sag' => ['Стрелец', '♐'],
        'Cap' => ['Козерог', '♑'], 'Aqu' => ['Водолей', '♒'], 'Pis' => ['Рыбы', '♓'],
    ];

    public function handle(): int
    {
        $testEmail = $this->option('test');
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        $service = app(UniSenderService::class);

        // Ищем пользователей с активной подпиской + канал email + тип daily
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
            ->whereHas('horoscopeTypes', function ($q) {
                $q->where('slug', 'daily');
            })
            ->with('profile');

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
            [$signName, $signEmoji] = $this->signsMeta[$sign];

            $horoscope = DailyHoroscope::where('date', $date)
                ->where('zodiac_sign', $sign)
                ->where('type', 'general')
                ->where('period', 'today')
                ->first();

            if (!$horoscope) {
                $this->warn("{$user->email}: нет гороскопа для {$signName}");
                $skipped++;
                continue;
            }

            [$html, $text] = $service->buildHoroscopeEmail($user->name, $signName, $signEmoji, $horoscope->content, $dateRu);
            $ok = $service->sendEmail($user->email, "✨ Ваш гороскоп на {$dateRu}", $html, $text);

            if ($ok) {
                $this->info("{$user->email}: отправлено ({$signName})");
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
