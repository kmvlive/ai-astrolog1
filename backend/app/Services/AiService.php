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

        if (!$apiKey) {
            Log::warning('TIMEWEB_AI_API_KEY not set');
            return null;
        }

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
                $data = $response->json();
                $text = $data['choices'][0]['message']['content'] ?? null;
                return $text ? trim($text) : null;
            }

            Log::error('Timeweb AI error', [
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 500),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Timeweb AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function getSystemPrompt(): string
    {
        return "Ты — профессиональный астролог с 20-летним опытом. "
            . "Составляй тёплые, поддерживающие и конкретные гороскопы на русском языке. "
            . "Опирайся на предоставленную натальную карту. "
            . "Не давай медицинских и финансовых гарантий, используй мягкие формулировки. "
            . "Формат ответа: 3-4 абзаца связного текста, без заголовков, списков и эмодзи. "
            . "Обращайся к пользователю по имени. Используй конкретные положения планет из карты.";
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

        $sun = $signsRu[$natalData['sun_sign'] ?? ''] ?? ($natalData['sun_sign'] ?? '?');
        $moon = $signsRu[$natalData['moon_sign'] ?? ''] ?? ($natalData['moon_sign'] ?? '?');
        $asc = $signsRu[$natalData['ascendant'] ?? ''] ?? ($natalData['ascendant'] ?? '?');

        $planets = $natalData['planets'] ?? [];
        $planetLines = [];
        foreach ($planets as $pname => $p) {
            $sign = $signsRu[$p['sign'] ?? ''] ?? ($p['sign'] ?? '?');
            $retro = !empty($p['retrograde']) ? ' (ретроградная)' : '';
            $house = str_replace('_House', '', $p['house'] ?? '');
            $planetLines[] = "- {$pname} в {$sign}, {$p['degree']}°{$retro}, {$house}";
        }

        $today = now()->locale('ru')->isoFormat('D MMMM YYYY');
        $typeRu = $typesRu[$type] ?? $typesRu['general'];

        return "Пользователь: {$name}.\n"
            . "Дата: {$today}.\n"
            . "Нужен: {$typeRu}.\n\n"
            . "Натальная карта:\n"
            . "Солнце в {$sun}, Луна в {$moon}, Асцендент в {$asc}.\n\n"
            . "Положения планет:\n" . implode("\n", $planetLines) . "\n\n"
            . "Составь персональный гороскоп, учитывая конкретные положения планет. "
            . "Обращайся к {$name} по имени. 3-4 абзаца связного текста.";
    }
}
