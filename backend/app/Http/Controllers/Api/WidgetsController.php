<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WidgetsController
{
    public function show(Request $request, string $type)
    {
        $data = match($type) {
            'moon' => $this->getMoon(),
            'horoscope' => $this->getHoroscope($request),
            'affirmation' => $this->getAffirmation(),
            'rune' => $this->getRune(),
            'tarot' => $this->getTarot(),
            'holiday' => $this->getHoliday(),
            'orthodox' => $this->getOrthodox(),
            'garden' => $this->getGarden(),
            'nameday' => $this->getNameday(),
            'lunar' => $this->getLunar(),
            'dream' => $this->getDream($request),
            default => ['error' => 'Unknown widget type'],
        };

        return response()->json($data)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET')
            ->header('Access-Control-Allow-Headers', 'Content-Type');
    }

    private function getMoon(): array
    {
        // Простой расчёт фазы луны
        $ts = time();
        $knownNewMoon = mktime(5, 0, 0, 1, 6, 2000); // Известное новолуние
        $synodicMonth = 29.53058867;
        $daysSinceNew = ($ts - $knownNewMoon) / 86400;
        $phase = fmod($daysSinceNew, $synodicMonth);
        $lunarDay = (int) floor($phase) + 1;

        $phaseName = match(true) {
            $phase < 1.85 => '🌑 Новолуние',
            $phase < 7.38 => '🌒 Растущий серп',
            $phase < 9.23 => '🌓 Первая четверть',
            $phase < 14.77 => '🌔 Растущая луна',
            $phase < 16.61 => '🌕 Полнолуние',
            $phase < 22.15 => '🌖 Убывающая луна',
            $phase < 23.99 => '🌗 Последняя четверть',
            default => '🌘 Убывающий серп',
        };

        return [
            'type' => 'moon',
            'phase' => $phaseName,
            'day' => $lunarDay,
            'emoji' => match(true) {
                $phase < 1.85 => '🌑',
                $phase < 7.38 => '🌒',
                $phase < 9.23 => '🌓',
                $phase < 14.77 => '🌔',
                $phase < 16.61 => '🌕',
                $phase < 22.15 => '🌖',
                $phase < 23.99 => '🌗',
                default => '🌘',
            },
        ];
    }

    private function getHoroscope(Request $request): array
    {
        $sign = $request->query('sign', 'aries');
        $period = $request->query('period', 'today');
        $slug = $this->signSlug($sign);

        $cacheKey = "widget_horoscope_{$sign}_{$period}";
        $data = cache($cacheKey);

        if (!$data) {
            try {
                $response = \Illuminate\Support\Facades\Http::get(url("/api/daily-horoscopes/{$slug}"));
                $data = $response->json() ?? [];
                cache([$cacheKey => $data], 3600);
            } catch (\Exception $e) {
                $data = [];
            }
        }

        $text = $data['horoscope']['content'] ?? 'Гороскоп временно недоступен';

        return [
            'type' => 'horoscope',
            'sign' => $sign,
            'period' => $period,
            'sign_name' => $this->signName($sign),
            'sign_slug' => $slug,
            'text' => $text,
            'emoji' => $this->signEmoji($sign),
        ];
    }

    private function signSlug(string $sign): string
    {
        return [
            'aries' => 'oven', 'taurus' => 'telec', 'gemini' => 'bliznecy', 'cancer' => 'rak',
            'leo' => 'lev', 'virgo' => 'deva', 'libra' => 'vesy', 'scorpio' => 'skorpion',
            'sagittarius' => 'strelec', 'capricorn' => 'kozerog', 'aquarius' => 'vodolej', 'pisces' => 'ryby',
        ][$sign] ?? $sign;
    }

    private function signName(string $sign): string
    {
        return [
            'aries' => 'Овен', 'taurus' => 'Телец', 'gemini' => 'Близнецы', 'cancer' => 'Рак',
            'leo' => 'Лев', 'virgo' => 'Дева', 'libra' => 'Весы', 'scorpio' => 'Скорпион',
            'sagittarius' => 'Стрелец', 'capricorn' => 'Козерог', 'aquarius' => 'Водолей', 'pisces' => 'Рыбы',
        ][$sign] ?? $sign;
    }

    private function signEmoji(string $sign): string
    {
        return [
            'aries' => '♈', 'taurus' => '♉', 'gemini' => '♊', 'cancer' => '♋',
            'leo' => '♌', 'virgo' => '♍', 'libra' => '♎', 'scorpio' => '♏',
            'sagittarius' => '♐', 'capricorn' => '♑', 'aquarius' => '♒', 'pisces' => '♓',
        ][$sign] ?? '⭐';
    }

    private function getAffirmation(): array
    {
        $cacheKey = 'widget_affirmation_today';
        $data = cache($cacheKey);

        if (!$data) {
            $url = url('/api/affirmations/today');
            $response = file_get_contents($url);
            $data = json_decode($response, true);
            cache([$cacheKey => $data], 3600);
        }

        return [
            'type' => 'affirmation',
            'title' => $data['title'] ?? $data['affirmation'] ?? 'Аффирмация дня',
            'text' => $data['text'] ?? $data['description'] ?? $data['body'] ?? '',
            'emoji' => '💫',
        ];
    }

    private function getRune(): array
    {
        $cacheKey = 'widget_rune_today';
        $data = cache($cacheKey);

        if (!$data) {
            $url = url('/api/runes/today');
            $response = file_get_contents($url);
            $data = json_decode($response, true);
            cache([$cacheKey => $data], 3600);
        }

        $rune = $data['rune'] ?? [];
        return [
            'type' => 'rune',
            'name' => $rune['name'] ?? '',
            'glyph' => $rune['glyph'] ?? '',
            'image' => $rune['image'] ?? '',
            'meaning' => $rune['meaning'] ?? '',
            'advice' => $rune['advice'] ?? '',
            'emoji' => 'ᚱ',
        ];
    }

    private function getTarot(): array
    {
        $cacheKey = 'widget_tarot_today';
        $data = cache($cacheKey);

        if (!$data) {
            $url = url('/api/tarot/today');
            $response = file_get_contents($url);
            $data = json_decode($response, true);
            cache([$cacheKey => $data], 3600);
        }

        $card = $data['card'] ?? [];
        return [
            'type' => 'tarot',
            'name' => $card['name'] ?? '',
            'image' => $card['image'] ?? '',
            'description' => $card['description'] ?? '',
            'number' => $card['id'] ?? '',
            'emoji' => '🃏',
        ];
    }

    private function getHoliday(): array
    {
        $mmdd = date('m-d');
        $holidays = json_decode(file_get_contents(storage_path('app/data/holidays-curated.json')), true);
        $today = $holidays[$mmdd] ?? [];

        return [
            'type' => 'holiday',
            'date' => date('d.m.Y'),
            'holidays' => array_slice($today, 0, 3),
            'emoji' => '🎉',
        ];
    }

    private function getOrthodox(): array
    {
        $mmdd = date('m-d');
        $orthodox = json_decode(file_get_contents(storage_path('app/data/orthodox.json')), true);
        $today = $orthodox[$mmdd] ?? [];

        return [
            'type' => 'orthodox',
            'date' => date('d.m.Y'),
            'holidays' => array_slice($today, 0, 3),
            'emoji' => '☦️',
        ];
    }

    private function getGarden(): array
    {
        $mmdd = date('m-d');
        $garden = json_decode(file_get_contents(storage_path('app/data/garden.json')), true);
        $today = $garden[$mmdd] ?? [];

        return [
            'type' => 'garden',
            'title' => $today['title'] ?? 'Календарь садовода',
            'text' => $today['text'] ?? '',
            'works' => array_slice($today['works'] ?? [], 0, 3),
            'emoji' => '🌱',
        ];
    }

    private function getNameday(): array
    {
        $mmdd = date('m-d');
        $wiki = json_decode(file_get_contents(storage_path('app/data/wiki-days.json')), true);
        $saints = json_decode(file_get_contents(storage_path('app/data/saint-names.json')), true);
        $saintsSet = array_flip($saints ?? []);

        $day = $wiki[$mmdd] ?? [];
        $rawNames = $day['names'] ?? [];

        $names = [];
        foreach ($rawNames as $name) {
            if (isset($saintsSet[$name])) {
                $names[] = $name;
            }
        }

        return [
            'type' => 'nameday',
            'date' => date('d.m.Y'),
            'names' => array_values(array_unique($names)),
            'emoji' => '🎂',
        ];
    }

    private function getLunar(): array
    {
        $moon = $this->getMoon();
        
        $recommendations = [
            '🌑' => 'Время для планирования и новых начинаний',
            '🌒' => 'Благоприятно для роста и развития проектов',
            '🌓' => 'Период принятия важных решений',
            '🌔' => 'Время для активных действий',
            '🌕' => 'Пик энергии — используйте для важных дел',
            '🌖' => 'Время для завершения дел',
            '🌗' => 'Период отдыха и восстановления',
            '🌘' => 'Время для очищения и подготовки',
        ];

        return [
            'type' => 'lunar',
            'phase' => $moon['phase'],
            'day' => $moon['day'],
            'emoji' => $moon['emoji'],
            'recommendation' => $recommendations[$moon['emoji']] ?? 'Следуйте своей интуиции',
        ];
    }

    private function getDream(Request $request): array
    {
        $symbol = $request->query('q', '');
        if (!$symbol) {
            return ['type' => 'dream', 'error' => 'Укажите символ сна'];
        }

        $rows = \App\Models\DreamSymbol::where('keyword', 'like', '%' . $symbol . '%')
            ->limit(3)
            ->get();

        $results = [];
        foreach ($rows as $r) {
            $arr = $r->toArray();
            $results[] = [
                'keyword' => $arr['keyword'] ?? $symbol,
                'meaning' => $arr['meaning'] ?? $arr['text'] ?? $arr['description'] ?? $arr['interpretation'] ?? '',
            ];
        }

        return [
            'type' => 'dream',
            'symbol' => $symbol,
            'results' => $results,
            'emoji' => '💭',
        ];
    }
}
