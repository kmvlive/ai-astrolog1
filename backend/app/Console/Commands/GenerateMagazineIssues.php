<?php

namespace App\Console\Commands;

use App\Models\Affirmation;
use App\Models\BlogPost;
use App\Models\FreeDailyHoroscope;
use App\Models\GeneratedHoroscope;
use App\Models\MagazineIssue;
use App\Models\TarotCard;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateMagazineIssues extends Command
{
    protected $signature = 'magazine:generate {--date= : Override issue date (Y-m-d)}';
    protected $description = 'Generate daily magazine issues for subscribed users';

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : Carbon::today();

        $users = User::where('magazine_subscribed', true)
            ->with('profile')
            ->get();

        $this->info("Generating magazine for {$date->format('Y-m-d')} ({$users->count()} subscribers)");

        $created = 0;
        $skipped = 0;

        foreach ($users as $user) {
            // Пропускаем, если выпуск уже существует
            if (MagazineIssue::where('user_id', $user->id)
                ->whereDate('issue_date', $date)
                ->exists()) {
                $skipped++;
                continue;
            }

            $content = $this->buildContent($user, $date);

            MagazineIssue::create([
                'user_id' => $user->id,
                'issue_date' => $date,
                'content' => $content,
            ]);

            $created++;
            $this->line("  ✓ {$user->email} (id={$user->id})");
        }

        $this->info("Created: {$created}, Skipped: {$skipped}");
        return 0;
    }

    private function buildContent(User $user, Carbon $date): array
    {
        return [
            'horoscope' => $this->getHoroscope($user, $date),
            'affirmation' => $this->getAffirmation($date),
            'tarot' => $this->getTarotToday(),
            'biorhythms' => $this->getBiorhythms($user, $date),
            'retrograde' => $this->getRetrograde(),
            'blog' => $this->getBlogPosts(),
            'meta' => [
                'user_name' => $user->name ?: $user->profile?->name,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    private function getHoroscope(User $user, Carbon $date): ?array
    {
        $signMap = [
            'Ari' => 'Овен', 'Tau' => 'Телец', 'Gem' => 'Близнецы', 'Can' => 'Рак',
            'Leo' => 'Лев', 'Vir' => 'Дева', 'Lib' => 'Весы', 'Sco' => 'Скорпион',
            'Sag' => 'Стрелец', 'Cap' => 'Козерог', 'Aqu' => 'Водолей', 'Pis' => 'Рыбы',
        ];

        // 1. Персональный на сегодня (платный или бесплатный персональный)
        $personal = \DB::table('horoscopes')
            ->where('user_id', $user->id)
            ->where('is_personal', true)
            ->whereDate('created_at', $date)
            ->orderByDesc('id')
            ->first();

        if ($personal) {
            return [
                'type' => 'personal',
                'horoscope_name' => 'Ваш персональный гороскоп',
                'content' => $personal->content,
                'generated_at' => $personal->created_at,
            ];
        }

        // 2. Бесплатный по знаку зодиака из daily_horoscopes
        $sign = $user->profile?->zodiac_sign;
        if ($sign) {
            $daily = \DB::table('daily_horoscopes')
                ->where('date', $date)
                ->where('zodiac_sign', $sign)
                ->where('period', 'today')
                ->where('type', 'general')
                ->first();

            if ($daily) {
                return [
                    'type' => 'daily_sign',
                    'sign' => $sign,
                    'sign_name' => $signMap[$sign] ?? $sign,
                    'content' => $daily->content,
                    'date' => $date->toDateString(),
                ];
            }
        }

        return null;
    }

    private function getAffirmation(Carbon $date): ?array
    {
        $a = Affirmation::whereDate('date', $date)->first();
        return $a ? ['title' => $a->title, 'description' => $a->description] : null;
    }

    private function getTarotToday(): ?array
    {
        $card = TarotCard::whereNotNull('meaning_today')
            ->where('meaning_today', '!=', '')
            ->inRandomOrder()
            ->first();

        if (!$card) {
            $card = TarotCard::inRandomOrder()->first();
        }

        return $card ? [
            'name' => $card->name,
            'slug' => $card->slug,
            'meaning_today' => $card->meaning_today ?: $card->description,
            'image' => $card->image,
        ] : null;
    }

    private function getBiorhythms(User $user, Carbon $date): ?array
    {
        $birth = $user->profile?->birth_date;
        if (!$birth) return null;

        $birthDate = Carbon::parse($birth);
        $daysAlive = $birthDate->diffInDays($date);

        // Формула: sin(2π × days / period), результат в %
        $physical   = sin(2 * pi() * $daysAlive / 23) * 100;
        $emotional  = sin(2 * pi() * $daysAlive / 28) * 100;
        $intellectual = sin(2 * pi() * $daysAlive / 33) * 100;

        return [
            'physical' => (int) round($physical),
            'emotional' => (int) round($emotional),
            'intellectual' => (int) round($intellectual),
            'days_alive' => (int) $daysAlive,
        ];
    }

    private function getRetrograde(): ?array
    {
        try {
            $controller = app(\App\Http\Controllers\Api\RetrogradeController::class);
            $data = $controller->index(request());
            if ($data && method_exists($data, 'getData')) {
                $payload = $data->getData(true);
                return $payload['planets'] ?? $payload;
            }
        } catch (\Throwable $e) {
            // Fallback — null
        }
        return null;
    }

    private function getBlogPosts(): array
    {
        $posts = BlogPost::published()
            ->orderByDesc('published_at')
            ->limit(4)
            ->get(['title', 'slug', 'excerpt', 'cover_image', 'published_at']);

        return $posts->map(fn($p) => [
            'title' => $p->title,
            'slug' => $p->slug,
            'excerpt' => $p->excerpt,
            'cover' => $p->cover_image,
            'date' => $p->published_at?->toDateString(),
            'url' => url('/blog/' . $p->slug),
        ])->toArray();
    }
}
