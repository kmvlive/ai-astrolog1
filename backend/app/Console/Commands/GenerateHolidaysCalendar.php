<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateHolidaysCalendar extends Command
{
    protected $signature = 'calendar:generate-holidays';
    protected $description = 'Курированный справочник праздников на все 365 дат (Timeweb LLM, с валидацией)';

    private const MONTHS = [1=>'январь',2=>'февраль',3=>'март',4=>'апрель',5=>'май',6=>'июнь',7=>'июль',8=>'август',9=>'сентябрь',10=>'октябрь',11=>'ноябрь',12=>'декабрь'];
    private const DAYS = [1=>31,2=>28,3=>31,4=>30,5=>31,6=>30,7=>31,8=>31,9=>30,10=>31,11=>30,12=>31];

    public function handle(): int
    {
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) { $this->error('Нет TIMEWEB_AI_API_KEY'); return 1; }

        $all = [];
        for ($m = 1; $m <= 12; $m++) {
            $data = null;
            for ($attempt = 1; $attempt <= 3; $attempt++) {
                try {
                    $resp = Http::timeout(180)
                        ->withHeaders(['Authorization' => "Bearer {$apiKey}", 'Content-Type' => 'application/json'])
                        ->post("{$baseUrl}/chat/completions", [
                            'model' => $model,
                            'messages' => [
                                ['role' => 'system', 'content' => 'Ты — редактор календаря праздников для русскоязычной аудитории из России. Возвращай ТОЛЬКО валидный JSON без markdown-обёрток.'],
                                ['role' => 'user', 'content' => $this->prompt(self::MONTHS[$m], self::DAYS[$m])],
                            ],
                            'temperature' => 0.4,
                            'max_tokens' => 8000,
                            'enable_thinking' => false,
                        ]);
                    if (!$resp->successful()) {
                        $this->warn("месяц {$m}: HTTP {$resp->status()} (попытка {$attempt})");
                        sleep(2); continue;
                    }
                    $data = $this->parseAndValidate((string) $resp->json('choices.0.message.content'), $m);
                    if ($data) break;
                    $this->warn("месяц {$m}: невалидный JSON (попытка {$attempt})");
                } catch (\Throwable $e) {
                    $this->warn("месяц {$m}: {$e->getMessage()} (попытка {$attempt})");
                }
                sleep(2);
            }
            if (!$data) {
                $this->error("Месяц {$m} не собран после 3 попыток — файл НЕ перезаписан");
                return 1;
            }
            $all += $data;
            $this->info("✓ " . self::MONTHS[$m] . ": " . count($data) . " дат");
            sleep(1);
        }

        // Полное покрытие: все 365 дат обязаны быть
        $missing = [];
        for ($m = 1; $m <= 12; $m++) {
            for ($d = 1; $d <= self::DAYS[$m]; $d++) {
                $key = sprintf('%02d-%02d', $m, $d);
                if (empty($all[$key])) $missing[] = $key;
            }
        }
        if ($missing) {
            $this->error('Отсутствуют даты: ' . implode(', ', array_slice($missing, 0, 10)) . ' — файл НЕ перезаписан');
            return 1;
        }

        $path = storage_path('app/data/calendars/holidays.json');
        @copy($path, $path . '.bak-' . date('Ymd-His'));
        $tmp = $path . '.tmp';
        file_put_contents($tmp, json_encode($all, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        rename($tmp, $path);

        Log::info('calendar:generate-holidays: справочник записан', ['dates' => count($all)]);
        $this->info("✓ holidays.json записан: " . count($all) . " дат, бэкап создан");
        return 0;
    }

    private function prompt(string $month, int $days): string
    {
        return "Составь календарь праздников на {$month}: все {$days} дат месяца, ключи в формате MM-DD.\n"
            . "Аудитория: русскоязычные подписчики из России. Тон: тёплый, дружелюбный.\n"
            . "На каждую дату 3-5 праздников из категорий:\n"
            . "- официальные праздники РФ и памятные даты России\n"
            . "- международные и всемирные дни (ООН и др.)\n"
            . "- профессиональные дни (День врача, День учителя, День программиста)\n"
            . "- народные и неформальные (День блинов, День кофе, День шоколада)\n"
            . "- добрые культурные и исторические события России\n"
            . "ЗАПРЕЩЕНО: траур, катастрофы, войны, смерти, теракты, дни независимости других стран, политические конфликты, «повешенные», «расстрелы».\n"
            . "Значение каждой даты: массив объектов {\"name\": \"название праздника\", \"text\": \"одно тёплое предложение до 120 символов\"}.\n"
            . "Верни ТОЛЬКО JSON-объект со всеми {$days} ключами месяца.";
    }

    private function parseAndValidate(string $content, int $m): ?array
    {
        $content = trim($content);
        $content = preg_replace('/^```(?:json)?\s*/u', '', $content);
        $content = preg_replace('/```\s*$/u', '', $content);
        $data = json_decode($content, true);
        if (!is_array($data) || !$data) return null;

        $out = [];
        for ($d = 1; $d <= self::DAYS[$m]; $d++) {
            $key = sprintf('%02d-%02d', $m, $d);
            $items = $data[$key] ?? null;
            if (!is_array($items) || !$items) return null; // строго: каждая дата обязательна
            $clean = [];
            foreach ($items as $it) {
                $name = is_array($it) ? trim((string) ($it['name'] ?? '')) : trim((string) $it);
                if ($name === '') continue;
                $text = is_array($it) ? trim((string) ($it['text'] ?? '')) : '';
                $clean[] = ['name' => $name, 'text' => mb_substr($text, 0, 200)];
            }
            if (count($clean) < 2) return null; // минимум 2 праздника на дату
            $out[$key] = array_slice($clean, 0, 6);
        }
        return $out;
    }
}
