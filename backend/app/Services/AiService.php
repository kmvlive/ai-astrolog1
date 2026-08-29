<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    public function generateHoroscope(array $natalData, string $type, string $name): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $this->getSystemPrompt()],
                        ['role' => 'user', 'content' => $this->buildPrompt($natalData, $type, $name)],
                    ],
                    'temperature' => 0.85,
                    'max_tokens' => 1500,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($text) : null;
            }

            Log::error('Timeweb AI error', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 500)]);
            return null;
        } catch (\Exception $e) {
            Log::error('Timeweb AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function generateDailyHoroscope(string $signCode, string $signRu, $date, string $type = 'general', string $period = 'today'): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        $typeRu = $this->dailyTypeRu($type);
        $periodRu = $this->periodRu($period, $date);
        $length = $this->periodLength($period);

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — профессиональный астролог. Составляй гороскопы для знаков зодиака на русском языке. Тёплый, поддерживающий тон. Без заголовков, списков и эмодзи. Обращайся на "вы".'],
                        ['role' => 'user', 'content' => "Составь {$typeRu} {$periodRu} для знака {$signRu}. Учитывай характер знака и планетарные влияния. {$length}"],
                    ],
                    'temperature' => 0.9,
                    'max_tokens' => $this->periodMaxTokens($period),
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($text) : null;
            }

            Log::error('Daily horoscope error', ['sign' => $signCode, 'type' => $type, 'period' => $period, 'status' => $response->status()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Daily horoscope exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function dailyTypeRu(string $type): string
    {
        return match ($type) {
            'love' => 'гороскоп любви и отношений',
            'career' => 'гороскоп карьеры и работы',
            'financial' => 'финансовый гороскоп',
            'health' => 'гороскоп здоровья и самочувствия',
            default => 'общий гороскоп',
        };
    }

    private function periodRu(string $period, $date): string
    {
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        return match ($period) {
            'today' => "на сегодня ({$dateRu})",
            'tomorrow' => "на завтра (" . $date->copy()->addDay()->locale('ru')->isoFormat('D MMMM YYYY') . ")",
            'week' => 'на текущую неделю (с понедельника по воскресенье)',
            'month' => 'на текущий месяц',
            'year' => 'на текущий год',
            default => "на {$dateRu}",
        };
    }

    private function periodLength(string $period): string
    {
        return match ($period) {
            'today', 'tomorrow' => '2-3 абзаца.',
            'week' => '4-5 абзацев, раздели на будни и выходные.',
            'month' => '6-7 абзацев, упомяни ключевые недели.',
            'year' => '8-10 абзацев, раздели по сезонам.',
            default => '2-3 абзаца.',
        };
    }

    private function periodMaxTokens(string $period): int
    {
        return match ($period) {
            'today', 'tomorrow' => 600,
            'week' => 900,
            'month' => 1200,
            'year' => 1800,
            default => 600,
        };
    }

    private function getSystemPrompt(): string
    {
        return "Ты — профессиональный астролог с 20-летним опытом. "
            . "Составляй тёплые, поддерживающие и конкретные гороскопы на русском языке. "
            . "Опирайся на предоставленную натальную карту. "
            . "Не давай медицинских и финансовых гарантий. "
            . "Формат: 3-4 абзаца связного текста, без заголовков, списков и эмодзи. "
            . "Обращайся к пользователю по имени.";
    }

    private function buildPrompt(array $natalData, string $type, string $name): string
    {
        $signsRu = [
            'Ari' => 'Овен', 'Tau' => 'Телец', 'Gem' => 'Близнецы',
            'Can' => 'Рак', 'Leo' => 'Лев', 'Vir' => 'Дева',
            'Lib' => 'Весы', 'Sco' => 'Скорпион', 'Sag' => 'Стрелец',
            'Cap' => 'Козерог', 'Aqu' => 'Водолей', 'Pis' => 'Рыбы',
        ];

        $typesRu = [
            'general' => 'общий гороскоп на сегодня',
            'love' => 'гороскоп любви и отношений на сегодня',
            'career' => 'гороскоп карьеры и работы на сегодня',
            'financial' => 'финансовый гороскоп на сегодня',
            'health' => 'гороскоп здоровья и самочувствия на сегодня',
        ];

        $sun = $signsRu[$natalData['sun_sign'] ?? ''] ?? '?';
        $moon = $signsRu[$natalData['moon_sign'] ?? ''] ?? '?';
        $asc = $signsRu[$natalData['ascendant'] ?? ''] ?? '?';

        $planetLines = [];
        foreach (($natalData['planets'] ?? []) as $pname => $p) {
            $sign = $signsRu[$p['sign'] ?? ''] ?? '?';
            $retro = !empty($p['retrograde']) ? ' (ретроградная)' : '';
            $house = str_replace('_House', '', $p['house'] ?? '');
            $planetLines[] = "- {$pname} в {$sign}, {$p['degree']}°{$retro}, {$house}";
        }

        $today = now()->locale('ru')->isoFormat('D MMMM YYYY');

        return "Пользователь: {$name}.\nДата: {$today}.\nНужен: " . ($typesRu[$type] ?? $typesRu['general']) . ".\n\n"
            . "Натальная карта:\nСолнце в {$sun}, Луна в {$moon}, Асцендент в {$asc}.\n"
            . "Положения планет:\n" . implode("\n", $planetLines) . "\n\n"
            . "Составь персональный гороскоп, учитывая конкретные положения планет. Обращайся по имени. 3-4 абзаца.";
    }
}
