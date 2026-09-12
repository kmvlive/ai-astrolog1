<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateOrthodoxCalendar extends Command
{
    protected $signature = 'calendar:generate-orthodox';
    protected $description = 'Курированный справочник православных праздников (Timeweb LLM + пасхалия)';

    private const MONTHS = [1=>'январь',2=>'февраль',3=>'март',4=>'апрель',5=>'май',6=>'июнь',7=>'июль',8=>'август',9=>'сентябрь',10=>'октябрь',11=>'ноябрь',12=>'декабрь'];
    private const DAYS = [1=>31,2=>28,3=>31,4=>30,5=>31,6=>30,7=>31,8=>31,9=>30,10=>31,11=>30,12=>31];

    // Фиксированные двунадесятые и великие праздники РПЦ
    private const FIXED = [
        '01-07' => 'Рождество Христово',
        '01-19' => 'Крещение Господне (Богоявление)',
        '02-15' => 'Сретение Господне',
        '04-07' => 'Благовещение Пресвятой Богородицы',
        '08-19' => 'Преображение Господне',
        '08-28' => 'Успение Пресвятой Богородицы',
        '09-21' => 'Рождество Пресвятой Богородицы',
        '09-27' => 'Воздвижение Креста Господня',
        '11-04' => 'Казанская икона Божией Матери',
        '12-04' => 'Введение во храм Пресвятой Богородицы',
        '07-07' => 'Рождество Иоанна Предтечи',
        '07-12' => 'Петров день (апостолов Петра и Павла)',
        '10-14' => 'Покров Пресвятой Богородицы',
    ];

    public function handle(): int
    {
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) { $this->error('Нет TIMEWEB_AI_API_KEY'); return 1; }

        $all = [];
        for ($m = 1; $m <= 12; $m++) {
            $daysInMonth = self::DAYS[$m];
            
            // Разбиваю большие месяцы (31 день) на 2 запроса
            if ($daysInMonth === 31) {
                $this->info(self::MONTHS[$m] . ": разбиваю на 2 части (1-15 и 16-31)");
                $data1 = $this->generateMonth($apiKey, $baseUrl, $model, $m, 1, 15);
                $data2 = $this->generateMonth($apiKey, $baseUrl, $model, $m, 16, 31);
                if (!$data1 || !$data2) {
                    $this->error("Месяц {$m} не собран после разбиения — файл НЕ перезаписан");
                    return 1;
                }
                $all += $data1 + $data2;
                $this->info("✓ " . self::MONTHS[$m] . ": " . (count($data1) + count($data2)) . " дат (2 запроса)");
                sleep(1);
                continue;
            }
            
            // Обычные месяцы (28-30 дней) - один запрос
            $data = $this->generateMonth($apiKey, $baseUrl, $model, $m, 1, $daysInMonth);
            if (!$data) {
                $this->error("Месяц {$m} не собран после 3 попыток — файл НЕ перезаписан");
                return 1;
            }
            $all += $data;
            $this->info("✓ " . self::MONTHS[$m] . ": " . count($data) . " дат");
            sleep(1);
        }
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

        // Полное покрытие: все 365 дат
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

        // Накладываем фиксированные праздники поверх
        foreach (self::FIXED as $key => $name) {
            if (!isset($all[$key])) continue;
            $has = false;
            foreach ($all[$key] as $it) {
                if (str_contains(mb_strtolower($it['name']), mb_strtolower($name))) { $has = true; break; }
            }
            if (!$has) {
                array_unshift($all[$key], ['name' => $name, 'text' => 'Великий праздник — день молитвы и благодарности.']);
            }
        }

        // Добавляем переходящие праздники для 2026-2030
        $this->addMovableHolidays($all);

        $path = storage_path('app/data/calendars/orthodox.json');
        @copy($path, $path . '.bak-' . date('Ymd-His'));
        $tmp = $path . '.tmp';
        file_put_contents($tmp, json_encode($all, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        rename($tmp, $path);

        Log::info('calendar:generate-orthodox: справочник записан', ['dates' => count($all)]);
        $this->info("✓ orthodox.json записан: " . count($all) . " дат, бэкап создан");
        return 0;
    }

    private function generateMonth(string $apiKey, string $baseUrl, string $model, int $m, int $startDay, int $endDay): ?array
    {
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $resp = Http::timeout(180)
                    ->withHeaders(['Authorization' => "Bearer {$apiKey}", 'Content-Type' => 'application/json'])
                    ->post("{$baseUrl}/chat/completions", [
                        'model' => $model,
                        'messages' => [
                            ['role' => 'system', 'content' => 'Ты — редактор православного календаря для русскоязычной аудитории. Возвращай ТОЛЬКО валидный JSON без markdown-обёрток.'],
                            ['role' => 'user', 'content' => $this->promptRange(self::MONTHS[$m], $startDay, $endDay)],
                        ],
                        'temperature' => 0.3,
                        'max_tokens' => 16000,
                        'enable_thinking' => false,
                    ]);
                if (!$resp->successful()) {
                    $this->warn("месяц {$m} (дни {$startDay}-{$endDay}): HTTP {$resp->status()} (попытка {$attempt})");
                    sleep(2); continue;
                }
                $data = $this->parseAndValidateRange((string) $resp->json('choices.0.message.content'), $m, $startDay, $endDay);
                if ($data) return $data;
                $this->warn("месяц {$m} (дни {$startDay}-{$endDay}): невалидный JSON (попытка {$attempt})");
            } catch (\Throwable $e) {
                $this->warn("месяц {$m} (дни {$startDay}-{$endDay}): {$e->getMessage()} (попытка {$attempt})");
            }
            sleep(2);
        }
        return null;
    }

    private function promptRange(string $month, int $startDay, int $endDay): string
    {
        $days = $endDay - $startDay + 1;
        $fixed = [];
        foreach (self::FIXED as $key => $name) {
            if (str_starts_with($key, sprintf('%02d-', array_search($month, self::MONTHS) + 1))) {
                $d = (int) substr($key, 3);
                if ($d >= $startDay && $d <= $endDay) {
                    $fixed[] = "{$key}: {$name}";
                }
            }
        }
        $fixedText = $fixed ? "Обязательные даты:\n" . implode("\n", $fixed) : "";
        
        return "Составь православный календарь на {$month}: даты с {$startDay} по {$endDay} (всего {$days} дат), ключи в формате MM-DD.\n"
            . "Аудитория: русскоязычные верующие Русской Православной Церкви.\n"
            . "На каждую дату 2-4 записи из категорий:\n"
            . "- великие и двунадесятые праздники (если есть)\n"
            . "- дни памяти святых и новомучеников Российских\n"
            . "- иконы Божией Матери и чудотворные образы\n"
            . "- дни особых богослужений и постов\n"
            . "Тон: благоговейный, тёплый, без траура и скорби.\n"
            . "Значение каждой даты: массив объектов {\"name\": \"название\", \"text\": \"одно тёплое предложение до 120 символов\"}.\n"
            . "Верни ТОЛЬКО JSON-объект со всеми {$days} ключами.\n"
            . $fixedText;
    }

    private function parseAndValidateRange(string $content, int $m, int $startDay, int $endDay): ?array
    {
        $content = trim($content);
        $content = preg_replace('/^```(?:json)?\s*/u', '', $content);
        $content = preg_replace('/```\s*$/u', '', $content);
        $data = json_decode($content, true);
        if (!is_array($data) || !$data) return null;

        $out = [];
        for ($d = $startDay; $d <= $endDay; $d++) {
            $key = sprintf('%02d-%02d', $m, $d);
            $items = $data[$key] ?? null;
            if (!is_array($items) || !$items) return null;
            $clean = [];
            foreach ($items as $it) {
                $name = is_array($it) ? trim((string) ($it['name'] ?? '')) : trim((string) $it);
                if ($name === '') continue;
                $text = is_array($it) ? trim((string) ($it['text'] ?? '')) : '';
                $clean[] = ['name' => $name, 'text' => mb_substr($text, 0, 200)];
            }
            if (count($clean) < 2) return null;
            $out[$key] = array_slice($clean, 0, 5);
        }
        return $out;
    }

    private function prompt(string $month, int $days): string
    {
        $fixed = [];
        foreach (self::FIXED as $key => $name) {
            if (str_starts_with($key, sprintf('%02d-', array_search($month, self::MONTHS) + 1))) {
                $fixed[] = "{$key}: {$name}";
            }
        }
        $fixedText = $fixed ? "Обязательные даты месяца:\n" . implode("\n", $fixed) : "";
        
        return "Составь православный календарь на {$month}: все {$days} дат месяца, ключи в формате MM-DD.\n"
            . "Аудитория: русскоязычные верующие Русской Православной Церкви.\n"
            . "На каждую дату 2-4 записи из категорий:\n"
            . "- великие и двунадесятые праздники (если есть)\n"
            . "- дни памяти святых и новомучеников Российских\n"
            . "- иконы Божией Матери и чудотворные образы\n"
            . "- дни особых богослужений и постов\n"
            . "Тон: благоговейный, тёплый, без траура и скорби.\n"
            . "Значение каждой даты: массив объектов {\"name\": \"название\", \"text\": \"одно тёплое предложение до 120 символов\"}.\n"
            . "Верни ТОЛЬКО JSON-объект со всеми {$days} ключами месяца.\n"
            . $fixedText;
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
            if (!is_array($items) || !$items) return null;
            $clean = [];
            foreach ($items as $it) {
                $name = is_array($it) ? trim((string) ($it['name'] ?? '')) : trim((string) $it);
                if ($name === '') continue;
                $text = is_array($it) ? trim((string) ($it['text'] ?? '')) : '';
                $clean[] = ['name' => $name, 'text' => mb_substr($text, 0, 200)];
            }
            if (count($clean) < 2) return null;
            $out[$key] = array_slice($clean, 0, 5);
        }
        return $out;
    }

    private function addMovableHolidays(array &$data): void
    {
        // Пасха (православная) по юлианскому календарю для 2026-2030
        $pascha = [
            2026 => ['month' => 4, 'day' => 12],
            2027 => ['month' => 5, 'day' => 2],
            2028 => ['month' => 4, 'day' => 16],
            2029 => ['month' => 4, 'day' => 8],
            2030 => ['month' => 4, 'day' => 28],
        ];

        foreach ($pascha as $year => $pd) {
            $p = \Carbon\Carbon::create($year, $pd['month'], $pd['day']);
            
            // Пасха
            $key = $p->format('m-d');
            if (isset($data[$key])) {
                array_unshift($data[$key], [
                    'name' => 'Светлое Христово Воскресение (Пасха)',
                    'text' => 'Христос воскресе! Величайший праздник — победа жизни над смертью.'
                ]);
            }

            // Масленица (7 дней перед Великим постом, начинается за 8 недель до Пасхи)
            $maslenitsaStart = $p->copy()->subWeeks(7);
            for ($i = 0; $i < 7; $i++) {
                $d = $maslenitsaStart->copy()->addDays($i);
                $key = $d->format('m-d');
                if (isset($data[$key]) && $d->year == $year) {
                    $names = ['Масленица', 'Масленичная седмица', 'Сырная седмица'];
                    array_unshift($data[$key], [
                        'name' => $names[$i % 3],
                        'text' => 'Неделя перед Великим постом — время радости и подготовки к духовному подвигу.'
                    ]);
                }
            }

            // Прощёное воскресенье (последний день перед постом)
            $forgiveness = $p->copy()->subDays(1);
            $key = $forgiveness->format('m-d');
            if (isset($data[$key]) && $forgiveness->year == $year) {
                array_unshift($data[$key], [
                    'name' => 'Прощёное воскресенье',
                    'text' => 'День примирения — попросите прощения у близких и простите сами.'
                ]);
            }

            // Вербное воскресенье (за неделю до Пасхи)
            $palm = $p->copy()->subWeek();
            $key = $palm->format('m-d');
            if (isset($data[$key]) && $palm->year == $year) {
                array_unshift($data[$key], [
                    'name' => 'Вход Господень в Иерусалим (Вербное воскресенье)',
                    'text' => 'Праздник торжества Христа — освящение вербы и начало Страстной седмицы.'
                ]);
            }

            // Вознесение (40-й день после Пасхи)
            $ascension = $p->copy()->addDays(39);
            $key = $ascension->format('m-d');
            if (isset($data[$key]) && $ascension->year == $year) {
                array_unshift($data[$key], [
                    'name' => 'Вознесение Господне',
                    'text' => 'Христос вознёсся на небо — обещание вечной жизни для всех верующих.'
                ]);
            }

            // Троица (50-й день после Пасхи)
            $trinity = $p->copy()->addDays(49);
            $key = $trinity->format('m-d');
            if (isset($data[$key]) && $trinity->year == $year) {
                array_unshift($data[$key], [
                    'name' => 'День Святой Троицы (Пятидесятница)',
                    'text' => 'Сошествие Святого Духа на апостолов — рождение Церкви Христовой.'
                ]);
            }
        }

        $this->info("✓ добавлены переходящие праздники для 2026-2030");
    }
}
