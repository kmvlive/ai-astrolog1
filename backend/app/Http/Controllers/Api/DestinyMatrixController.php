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

        $userId = $this->resolveUserId($request);

        // Повторный расчёт той же даты — возвращаем из БД (без AI-запроса)
        $q = \App\Models\DestinyMatrix::where('birth_date', date('Y-m-d', strtotime($date)));
        $userId ? $q->where('user_id', $userId) : $q->whereNull('user_id');
        $existing = $q->first();
        if ($existing) {
            return response()->json([
                'date' => date('d.m.Y', strtotime($date)),
                'positions' => $existing->positions,
                'interpretation' => $existing->interpretation,
                'uuid' => $existing->uuid,
                'from_db' => true,
            ]);
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

        $positions = $this->enrichPositions($positions);

        // Кеш AI-толкования по дате (24 часа)
        $cacheKey = 'destiny_matrix_' . md5($date);
        $aiText = Cache::remember($cacheKey, 86400, function () use ($date, $positions) {
            $prompt = $this->buildPrompt($date, $positions);
            $ai = app(AiService::class);
            return $ai->chat($prompt, ['temperature' => 0.8, 'max_tokens' => 1500]) ?? 'Толкование временно недоступно.';
        });

        $row = \App\Models\DestinyMatrix::create([
            'user_id' => $userId,
            'birth_date' => date('Y-m-d', $ts),
            'positions' => $positions,
            'interpretation' => $aiText,
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
        ]);

        return response()->json([
            'date' => date('d.m.Y', $ts),
            'positions' => $positions,
            'interpretation' => $aiText,
            'uuid' => $row->uuid,
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

    public function history(Request $request)
    {
        $rows = \App\Models\DestinyMatrix::where('user_id', $request->user('sanctum')->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'items' => $rows->map(fn ($r) => [
                'uuid' => $r->uuid,
                'birth_date' => $r->birth_date->format('d.m.Y'),
                'positions' => $r->positions,
                'created_at' => $r->created_at->format('d.m.Y H:i'),
            ]),
            'total' => $rows->count(),
        ]);
    }

    private function resolveUserId(Request $request): ?int
    {
        return $request->user('sanctum')?->id;
    }

    public function share(string $uuid)
    {
        $row = \App\Models\DestinyMatrix::where('uuid', $uuid)->first();
        if (!$row) return response()->json(['error' => 'not found'], 404);

        return response()->json([
            'date' => $row->birth_date->format('d.m.Y'),
            'positions' => $row->positions,
            'interpretation' => $row->interpretation,
            'uuid' => $row->uuid,
        ]);
    }

    /**
     * Добавляет к каждой позиции аркан Таро (имя + картинка)
     */
    private function enrichPositions(array $positions): array
    {
        foreach ($positions as $num => $pos) {
            $positions[$num]['arcana'] = $this->arcanaFor((int) $pos['value']);
        }
        return $positions;
    }

    private function arcanaFor(int $n): ?array
    {
        static $cache = [];
        if (array_key_exists($n, $cache)) return $cache[$n];

        $names = [
            1 => ['Маг'], 2 => ['Жрица', 'Верховная Жрица'], 3 => ['Императрица'], 4 => ['Император'],
            5 => ['Иерофант', 'Верховный Жрец', 'Жрец'], 6 => ['Влюблённые', 'Влюбленные'], 7 => ['Колесница'],
            8 => ['Сила'], 9 => ['Отшельник'], 10 => ['Колесо Фортуны'], 11 => ['Справедливость', 'Правосудие'],
            12 => ['Повешенный'], 13 => ['Смерть'], 14 => ['Умеренность'], 15 => ['Дьявол'], 16 => ['Башня'],
            17 => ['Звезда'], 18 => ['Луна'], 19 => ['Солнце'], 20 => ['Суд', 'Страшный суд'], 21 => ['Мир'],
            22 => ['Шут', 'Дурак', 'Глупец'],
        ][$n] ?? [];

        $card = null;
        foreach ($names as $nm) {
            $low = mb_strtolower($nm);
            $card = \App\Models\TarotCard::whereRaw('LOWER(name) = ?', [$low])->first()
                 ?? \App\Models\TarotCard::whereRaw('LOWER(name) LIKE ?', ["%{$low}%"])->first();
            if ($card) break;
        }

        $cache[$n] = $card ? ['name' => $card->name, 'image' => $card->image] : null;
        return $cache[$n];
    }
}
