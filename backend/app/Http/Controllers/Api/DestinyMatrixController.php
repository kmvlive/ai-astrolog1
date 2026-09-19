<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Services\AiService;

class DestinyMatrixController
{
    public function calculate(Request $request)
    {
        $date = $request->input('date');
        if (!$date || !strtotime($date)) {
            return response()->json(['error' => 'Укажите дату в формате YYYY-MM-DD'], 422);
        }

        $ts = strtotime($date);
        $day = (int) date('j', $ts);
        $month = (int) date('n', $ts);
        $year = (int) date('Y', $ts);
        $yearDigitsSum = array_sum(str_split($year));

        // Методика Ладини: 8 основных позиций
        $positions = [
            1 => ['name' => 'Личность', 'value' => $this->reduce($day)],
            2 => ['name' => 'Таланты', 'value' => $this->reduce($month)],
            3 => ['name' => 'Предназначение', 'value' => $this->reduce($yearDigitsSum)],
            4 => ['name' => 'Центр', 'value' => $this->reduce($day + $month + $yearDigitsSum)],
            5 => ['name' => 'Карма', 'value' => $this->reduce($day + $month)],
            6 => ['name' => 'Деньги', 'value' => $this->reduce($day + $yearDigitsSum)],
            7 => ['name' => 'Любовь', 'value' => $this->reduce($month + $yearDigitsSum)],
            8 => ['name' => 'Итог', 'value' => $this->reduce($day + $month + $yearDigitsSum + $this->reduce($day) + $this->reduce($month) + $this->reduce($yearDigitsSum))],
        ];

        // Кеш AI-толкования по дате (24 часа)
        $cacheKey = 'destiny_matrix_' . md5($date);
        $aiText = Cache::remember($cacheKey, 86400, function () use ($date, $positions) {
            $prompt = $this->buildPrompt($date, $positions);
            $ai = app(AiService::class);
            return $ai->chat($prompt, ['temperature' => 0.8, 'max_tokens' => 1500]) ?? 'Толкование временно недоступно.';
        });

        return response()->json([
            'date' => date('d.m.Y', $ts),
            'positions' => $positions,
            'interpretation' => $aiText,
        ]);
    }

    private function reduce(int $n): int
    {
        while ($n > 22) {
            $n = array_sum(str_split($n));
        }
        return $n ?: 22;
    }

    private function buildPrompt(string $date, array $positions): string
    {
        $posText = '';
        foreach ($positions as $num => $pos) {
            $posText .= "{$num}. {$pos['name']}: аркан {$pos['value']}\n";
        }

        return <<<PROMPT
Ты — опытный нумеролог-таролог, специалист по Матрице судьбы Наталии Ладини.
Проанализируй матрицу для даты рождения {$date}:

{$posText}

Дай глубокое толкование:
1. **Общий характер** — кто этот человек, его суть
2. **Таланты и дары** — природные способности
3. **Предназначение** — миссия жизни
4. **Кармические задачи** — что нужно проработать
5. **Финансовый потенциал** — путь к изобилию
6. **Отношения и любовь** — партнёрство и семья
7. **Итоговый совет** — как реализовать потенциал

Стиль: тёплый, вдохновляющий, практичный. Используй **жирный** для ключевых слов. 400-600 слов.
PROMPT;
    }
}
