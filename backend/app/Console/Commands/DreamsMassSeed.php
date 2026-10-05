<?php

namespace App\Console\Commands;

use App\Models\DreamSymbol;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class DreamsMassSeed extends Command
{
    protected $signature = 'dreams:mass-seed
        {action : generate-pool | interpret-pool}
        {--pool-size=15000}
        {--categories=}
        {--mult=2 : множитель квот категорий}';
    protected $description = 'Фабрика сонника: generate-pool — пул слов, interpret-pool — толкования из пула';

    private const CATEGORIES = [
        'домашние животные и скот' => 200,
        'дикие животные и звери' => 250,
        'птицы' => 200,
        'рыбы и морские обитатели' => 150,
        'насекомые и пауки' => 150,
        'рептилии и земноводные' => 80,
        'еда и блюда' => 300,
        'напитки' => 100,
        'фрукты, овощи и ягоды' => 200,
        'сладости и выпечка' => 120,
        'одежда и обувь' => 200,
        'украшения и аксессуары' => 150,
        'мебель и интерьер' => 200,
        'посуда и кухонная утварь' => 150,
        'инструменты и стройка' => 150,
        'бытовая техника' => 120,
        'транспорт и дорога' => 200,
        'здания и помещения' => 250,
        'двор, сад, огород' => 120,
        'природа и ландшафты' => 250,
        'погода и атмосферные явления' => 150,
        'водоёмы и вода' => 150,
        'деревья и кустарники' => 150,
        'цветы и комнатные растения' => 200,
        'грибы' => 60,
        'части тела и органы' => 150,
        'здоровье и болезни' => 150,
        'волосы, зубы и ногти' => 80,
        'семья и родственники' => 150,
        'свадьба и праздники' => 120,
        'смерть и похороны' => 80,
        'профессии и работа' => 200,
        'деньги и имущество' => 150,
        'школа и учёба' => 120,
        'война и оружие' => 120,
        'спорт и игры' => 150,
        'музыка и музыкальные инструменты' => 120,
        'книги и письмо' => 100,
        'религия и церковь' => 120,
        'магия и гадания' => 120,
        'мифические существа и сказки' => 150,
        'цвета' => 60,
        'числа и счёт' => 60,
        'формы и фигуры' => 60,
        'эмоции и чувства' => 150,
        'действия и движения' => 200,
        'звуки и запахи' => 100,
        'времена года и время суток' => 80,
        'небо и космос' => 120,
        'огонь и дым' => 80,
        'камни и минералы' => 100,
        'материалы и ткани' => 100,
        'грязь и мусор' => 80,
        'свет и тьма' => 60,
        'двери, замки и ключи' => 80,
        'окна и лестницы' => 80,
        'цвет + животное (чёрная кошка, белый пёс)' => 400,
        'действия животных (кусает, гонится, царапает)' => 300,
        'бытовые ситуации (опоздать, потерять, найти)' => 300,
        'состояния одежды (рваная, грязная, новая)' => 200,
        'погодные условия (ливень, снегопад, туман, град)' => 200,
        'денежные ситуации (долг, зарплата, потеря денег)' => 200,
        'транспортные ситуации (опоздать на поезд, авария)' => 200,
        'природные катастрофы (наводнение, ураган, пожар)' => 200,
        'еда и готовка (есть, готовить, угощать)' => 250,
        'праздники и обряды (день рождения, крестины)' => 200,
        // === РАУНД 2: нишевые категории для добора до 12к ===
        'старинные русские предметы (сани, лапти, кокошник)' => 400,
        'редкие и старые профессии (бондарь, мельник, трубочист)' => 300,
        'современные гаджеты и технологии (смартфон, нейросеть, дрон)' => 300,
        'детали одежды (молния, пуговица, капюшон)' => 300,
        'детали еды (корка, мякиш, подлива)' => 300,
        'природные объекты (коряга, пень, муравейник)' => 300,
        'городские объекты (фонарь, люк, переход)' => 300,
        'деревенский быт (сеновал, сарай, колодец)' => 300,
        'море и морское (прибой, отмель, такелаж)' => 300,
        'горы и туризм (привал, карниз, ледник)' => 300,
        'детство и игры (качели, песочница, волчок)' => 300,
        'вещества и материалы (смола, янтарь, ртуть)' => 300,
        'цвета + предметы (белая рубашка, красная машина)' => 400,
        'части предметов (ручка, носик, лезвие)' => 300,
        'следы и отметины (царапина, вмятина, потёртость)' => 300,
    ];

    public function handle(): int
    {
        $action = $this->argument('action');
        if ($action === 'generate-pool') return $this->generatePool();
        if ($action === 'interpret-pool') return $this->interpretPool();
        $this->error('Неизвестное действие: ' . $action);
        return self::FAILURE;
    }

    // ---------- ЭТАП 1: ПУЛ СЛОВ ----------

    private function generatePool(): int
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) { $this->error('Нет TIMEWEB_AI_API_KEY'); return self::FAILURE; }

        $poolSize = (int) $this->option('pool-size');
        $cats = $this->option('categories')
            ? array_map('trim', explode(',', $this->option('categories')))
            : array_keys(self::CATEGORIES);

        $seen = [];
        foreach (DreamSymbol::pluck('keyword') as $kw) $seen[$this->norm($kw)] = true;
        $this->info('Существующих в БД: ' . count($seen));

        $poolFile = storage_path('app/dreams-pool.json');
        $pool = [];
        if (file_exists($poolFile)) {
            $pool = json_decode(file_get_contents($poolFile), true) ?: [];
            foreach ($pool as $w) $seen[$this->norm($w)] = true;
            $this->info('Уже в пуле: ' . count($pool));
        }

        foreach ($cats as $cat) {
            if (!isset(self::CATEGORIES[$cat])) { $this->warn("Неизвестная категория: {$cat}"); continue; }
            if (count($pool) >= $poolSize) break;

            $before = count($pool);
            $quota = (int) (self::CATEGORIES[$cat] * (int) $this->option('mult'));
            $excludeArr = [];
            $words = [];
            $tries = 0;
            while (count($words) < $quota && $tries < 4) {
                $batch = $this->generateWords($baseUrl, $apiKey, $model, $cat, min(150, $quota), $excludeArr);
                foreach ($batch as $w) {
                    $n = is_string($w) ? $this->norm($w) : '';
                    if ($n !== '' && isset($seen[$n]) && !in_array($n, $excludeArr)) $excludeArr[] = $n;
                }
                $excludeArr = array_slice($excludeArr, 0, 400);
                $words = array_merge($words, $batch);
                $tries++;
                sleep(1);
            }
            $rej = ['dup' => 0, 'regex' => 0, 'garbage' => 0, 'other' => 0];
            $rejSamples = [];
            foreach ($words as $w) {
                if (!is_string($w)) { $rej['other']++; continue; }
                $n = $this->norm($w);
                if ($n === '') { $rej['other']++; continue; }
                if (isset($seen[$n])) { $rej['dup']++; continue; }
                if (!preg_match('/^[а-яе][а-яе\s\-]*$/u', $n)) {
                    $rej['regex']++;
                    if (count($rejSamples) < 8) $rejSamples[] = 'REGEX: [' . $n . ']';
                    continue;
                }
                if (mb_strlen($n) < 2 || mb_strlen($n) > 40) { $rej['regex']++; continue; }
                if ($this->isGarbage($n)) {
                    $rej['garbage']++;
                    if (count($rejSamples) < 8) $rejSamples[] = 'GARBAGE: [' . $n . ']';
                    continue;
                }
                $seen[$n] = true;
                $pool[] = $n;
                if (count($pool) >= $poolSize) break;
            }
            $this->info("«{$cat}»: +" . (count($pool) - $before) . " (в пуле: " . count($pool) . ") | получено от модели: " . count($words) . " | отсеяно => дубли: {$rej['dup']}, regex: {$rej['regex']}, мусор: {$rej['garbage']}, прочее: {$rej['other']}");
            foreach ($rejSamples as $s) $this->line('     пример отсева: ' . $s);
            sleep(1);
        }

        file_put_contents($poolFile, json_encode($pool, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $this->info("ПУЛ СОХРАНЁН: {$poolFile}, слов: " . count($pool));
        return self::SUCCESS;
    }

    // ---------- ЭТАП 2: ТОЛКОВАНИЯ ИЗ ПУЛА ----------

    private function interpretPool(): int
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) { $this->error('Нет TIMEWEB_AI_API_KEY'); return self::FAILURE; }

        $poolFile = storage_path('app/dreams-pool.json');
        if (!file_exists($poolFile)) {
            $this->error('Пул не найден. Сначала: dreams:mass-seed generate-pool');
            return self::FAILURE;
        }
        $pool = json_decode(file_get_contents($poolFile), true) ?: [];
        $this->info('В пуле: ' . count($pool));

        $iter = 0;
        $emptyStreak = 0;
        while (true) {
            $existing = DreamSymbol::pluck('keyword')->map(fn($k) => $this->norm($k))->flip()->all();
            $todo = array_values(array_filter($pool, fn($w) => !isset($existing[$this->norm($w)])));
            if (empty($todo)) break;

            $chunk = array_slice($todo, 0, 30);
            $saved = $this->interpretChunk($baseUrl, $apiKey, $model, $chunk, (string) ++$iter);

            if ($saved === 0) {
                $emptyStreak++;
                if ($emptyStreak >= 3) {
                    $poison = $todo[0];
                    $pool = array_values(array_filter($pool, fn($w) => $w !== $poison));
                    $this->warn("3 пустых батча подряд — принудительно пропускаю «{$poison}»");
                    $emptyStreak = 0;
                }
            } else {
                $emptyStreak = 0;
            }

            // сохраняем прогресс: убираем из пула всё, что уже в БД
            $existing = DreamSymbol::pluck('keyword')->map(fn($k) => $this->norm($k))->flip()->all();
            $pool = array_values(array_filter($pool, fn($w) => !isset($existing[$this->norm($w)])));
            file_put_contents($poolFile, json_encode($pool, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            $this->info('Прогресс: осталось в пуле ' . count($pool) . ' | всего в БД: ' . DreamSymbol::count());
            sleep(1);
        }

        $this->info('ГОТОВО! Всего записей: ' . DreamSymbol::count());
        return self::SUCCESS;
    }

    // ---------- ХЕЛПЕРЫ ----------

    private const STOP_TAILS = [
        'тайна', 'загадка', 'проблема', 'сложность', 'трудность', 'затруднение',
        'операция', 'действие', 'поступок', 'решение', 'явление', 'понятие',
        'суть', 'смысл', 'тема', 'вопрос', 'ответ', 'идея', 'мысль', 'процесс',
        'результат', 'итог', 'цель', 'задача', 'план', 'способ', 'метод',
        'прием', 'средство', 'символ', 'знак', 'значение', 'толкование',
        'источник', 'вид', 'тип', 'разновидность', 'пример', 'вариант',
        'образ', 'картина', 'ситуация', 'обстоятельство', 'случай', 'момент',
    ];

    private function isGarbage(string $n): bool
    {
        $parts = explode(' ', $n);
        // Максимум 2 слова (однословное или 'чёрная кошка')
        if (count($parts) > 2) return true;
        // Каждое слово не длиннее 15 символов
        foreach ($parts as $p) {
            if (mb_strlen($p) > 15) return true;
        }
        // Стоп-лист абстрактных хвостов
        if (count($parts) >= 1 && in_array(end($parts), self::STOP_TAILS, true)) {
            return true;
        }
        // Запрет на 'снежные/зимние/летние/...' в начале (галлюцинации модели)
        $badPrefixes = ['снежные', 'зимние', 'летние', 'весенние', 'осенние', 'ночные', 'дневные', 'утренние', 'вечерние'];
        if (count($parts) >= 2 && in_array($parts[0], $badPrefixes, true)) {
            return true;
        }
        return false;
    }

    private const HOMOGLYPHS = [
        'a' => 'а', 'e' => 'е', 'o' => 'о', 'p' => 'р', 'c' => 'с', 'y' => 'у',
        'x' => 'х', 'k' => 'к', 'm' => 'м', 't' => 'т', 'b' => 'в', 'g' => 'г',
        'i' => 'и', 'l' => 'л', 'n' => 'н', 'u' => 'у', 's' => 'с', 'z' => 'з',
    ];

    private function norm(string $s): string
    {
        $s = @iconv('UTF-8', 'UTF-8//IGNORE', $s) ?: $s;
        $s = mb_strtolower(trim($s));
        $s = strtr($s, self::HOMOGLYPHS);
        $s = str_replace('ё', 'е', $s);
        $s = preg_replace('/\s+/u', ' ', $s);
        return trim($s, " \t\n\r,.!?;:«»\"'()[]{}");
    }

    private function generateWords(string $baseUrl, string $apiKey, string $model, string $category, int $count, array $exclude = []): array
    {
        $prompt = "Ты — составитель сонника. Верни СТРОГО JSON-массив без markdown из {$count} русских слов для категории «{$category}».

ЖЁСТКИЕ ПРАВИЛА:
- Только ОДНОСЛОВНЫЕ существительные в именительном падеже, единственном числе
- Никаких прилагательных, наречий, глаголов, составных фраз
- Никаких абстрактных понятий (тайна, проблема, идея, способ, источник, процесс)
- Только КОНКРЕТНЫЕ предметы, существа, явления, которые реально видят во сне
- Каждое слово — от 3 до 15 букв, кириллица
- Без повторов, без пояснений, без нумерации, только массив строк

Пример правильного ответа для 'животные': [\"кошка\", \"собака\", \"лошадь\", \"корова\"]
Пример НЕПРАВИЛЬНОГО: [\"чёрная кошка\", \"собачий лай\", \"источник страха\"]

Слова:";
        if (!empty($exclude)) {
            $prompt .= "\nЗАПРЕЩЕНО возвращать эти слова (они уже заняты): " . implode(', ', $exclude);
        }

        try {
            $resp = Http::timeout(120)->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'temperature' => 0.9,
                'max_tokens' => 3000,
                'enable_thinking' => false,
            ]);
            if (!$resp->successful()) { $this->warn("Слова «{$category}»: HTTP {$resp->status()}"); return []; }

            $raw = trim($resp->json('choices.0.message.content'));
            $text = $raw;
            $s = strpos($text, '['); $e = strrpos($text, ']');
            if ($s !== false && $e !== false) $text = substr($text, $s, $e - $s + 1);
            $data = json_decode($text, true);

            if (!is_array($data)) {
                // fallback 1: вытаскиваем строки в кавычках
                if (preg_match_all('/"([^"\n]{2,60})"/u', $raw, $m) && count($m[1]) > 0) {
                    $data = $m[1];
                    $this->warn("«{$category}»: JSON не строгий — спас fallback (кавычки), слов: " . count($data));
                } else {
                    // fallback 2: список без кавычек — режем по запятым/строкам
                    $inner = trim($raw, "[] \n\t");
                    $parts = preg_split('/[,\n;]+/u', $inner);
                    $data = array_map(fn($x) => trim($x, " \t\"«»'"), $parts);
                    $this->warn("«{$category}»: JSON не строгий — спас fallback (split), слов: " . count($data));
                }
            }

            if (!is_array($data) || empty($data)) {
                $this->warn("«{$category}»: ПУСТО. Начало ответа: " . mb_substr($raw, 0, 300));
                return [];
            }
            return array_values($data);
        } catch (\Throwable $e) {
            $this->warn("Слова «{$category}»: " . $e->getMessage());
            return [];
        }
    }

    private function interpretChunk(string $baseUrl, string $apiKey, string $model, array $chunk, string $tag): int
    {
        $prompt = "Ты — сонник. Верни СТРОГО JSON-объект без markdown: ключ — слово, значение — толкование сна на русском (1-2 предложения, тёплый тон). Слова: " . implode(', ', $chunk);

        try {
            $resp = Http::timeout(120)->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'temperature' => 0.7,
                'max_tokens' => 3500,
                'enable_thinking' => false,
            ]);
            if (!$resp->successful()) { $this->warn("Батч {$tag}: HTTP {$resp->status()}"); return 0; }

            $text = trim($resp->json('choices.0.message.content'));
            $s = strpos($text, '{'); $e = strrpos($text, '}');
            if ($s !== false && $e !== false) $text = substr($text, $s, $e - $s + 1);
            $data = json_decode($text, true);
            if (!is_array($data)) { $this->warn("Батч {$tag}: JSON не распознан"); return 0; }

            $chunkNorm = array_map(fn($x) => $this->norm($x), $chunk);
            $saved = 0;
            foreach ($data as $kw => $interp) {
                $n = $this->norm((string) $kw);
                if (!in_array($n, $chunkNorm, true)) continue; // битые/левые ключи мимо
                if (!mb_check_encoding($n, 'UTF-8')) continue; // двойная страховка от битых байт
                if ($n === '' || !is_string($interp) || mb_strlen(trim($interp)) < 10) continue;
                try {
                    if (DreamSymbol::where('keyword', $n)->exists()) continue;
                    DreamSymbol::create([
                        'keyword' => $n,
                        'interpretation' => trim($interp),
                        'ai_generated' => true,
                        'approved' => true,
                    ]);
                    $saved++;
                } catch (\Throwable $e) {
                    $this->warn("Батч {$tag}: пропускаю ключ («{$n}»): " . mb_substr($e->getMessage(), 0, 80));
                }
            }
            $this->info("Батч {$tag}: сохранено {$saved}");
            return $saved;
        } catch (\Throwable $e) {
            $this->warn("Батч {$tag}: " . $e->getMessage());
            return 0;
        }
    }
}
