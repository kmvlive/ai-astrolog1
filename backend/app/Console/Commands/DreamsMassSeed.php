<?php

namespace App\Console\Commands;

use App\Models\DreamSymbol;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class DreamsMassSeed extends Command
{
    protected $signature = 'dreams:mass-seed 
        {action : generate-pool | interpret-pool}
        {--pool-size=15000}
        {--batch-size=500}
        {--categories=}';
        
    protected $description = 'Двухэтапная фабрика сонника: generate-pool создаёт пул слов, interpret-pool генерит толкования из пула';

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
    ];

    private array $seen = [];

    public function handle(): int
    {
        $action = $this->argument('action');
        
        if ($action === 'generate-pool') {
            return $this->generatePool();
        } elseif ($action === 'interpret-pool') {
            return $this->interpretPool();
        }
        
        $this->error("Неизвестное действие: {$action}. Используйте generate-pool или interpret-pool");
        return self::FAILURE;
    }

    private function generatePool(): int
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) { $this->error('Нет TIMEWEB_AI_API_KEY'); return self::FAILURE; }

        $poolSize = (int) $this->option('pool-size');
        $categories = $this->option('categories') ? explode(',', $this->option('categories')) : array_keys(self::CATEGORIES);

        // Загружаем существующие слова
        foreach (DreamSymbol::pluck('keyword') as $kw) {
            $this->seen[$this->norm($kw)] = true;
        }
        $this->info("Загружено существующих: " . count($this->seen));

        // Загружаем уже сгенерённый пул (если есть)
        $poolFile = storage_path('app/dreams-pool.json');
        $pool = [];
        if (file_exists($poolFile)) {
            $pool = json_decode(file_get_contents($poolFile), true) ?: [];
            $this->info("Загружено из пула: " . count($pool));
            foreach ($pool as $w) $this->seen[$this->norm($w)] = true;
        }

        $totalAdded = 0;
        
        foreach ($categories as $cat) {
            if (!isset(self::CATEGORIES[$cat])) {
                $this->warn("Неизвестная категория: {$cat}");
                continue;
            }
            
            $quota = self::CATEGORIES[$cat];
            $this->info("Категория «{$cat}»: квота {$quota}");

            $words = $this->generateWords($baseUrl, $apiKey, $model, $cat, $quota * 2); // запас x2
            
            foreach ($words as $w) {
                if (!is_string($w)) continue;
                $n = $this->norm($w);
                if ($n === '' || isset($this->seen[$n])) continue;
                if (!preg_match('/^[а-яе][а-яе\s\-]*$/u', $n)) continue;
                if (mb_strlen($n) < 2 || mb_strlen($n) > 40) continue;
                
                $this->seen[$n] = true;
                $pool[] = $n;
                $totalAdded++;
                
                if (count($pool) >= $poolSize) {
                    $this->info("Достигнут размер пула: {$poolSize}");
                    break 2;
                }
            }
            
            $this->info("Добавлено в пул: " . count($pool));
            sleep(2);
        }

        // Сохраняем пул
        file_put_contents($poolFile, json_encode($pool, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $this->info("Пуль сохранён: {$poolFile} (всего слов: " . count($pool) . ")");
        
        return self::SUCCESS;
    }

    private function interpretPool(): int
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) { $this->error('Нет TIMEWEB_AI_API_KEY'); return self::FAILURE; }

        $batchSize = (int) $this->option('batch-size');
        $poolFile = storage_path('app/dreams-pool.json');
        
        if (!file_exists($poolFile)) {
            $this->error("Пуль не найден. Сначала запустите: dreams:mass-seed generate-pool");
            return self::FAILURE;
        }

        $pool = json_decode(file_get_contents($poolFile), true) ?: [];
        $this->info("Загружено из пула: " . count($pool) . " слов");

        // Загружаем существующие
        $existing = DreamSymbol::pluck('keyword')->map(fn($k) => $this->norm($k))->flip();
        
        // Фильтруем уже обработанные
        $todo = array_values(array_filter($pool, fn($w) => !isset($existing[$this->norm($w)])));
        $this->info("К обработке: " . count($todo) . " (из пула " . count($pool) . ", уже есть " . count($existing) . ")");

        $processed = 0;
        foreach (array_chunk($todo, $batchSize) as $chunkNum => $chunk) {
            $this->info("Батч " . ($chunkNum + 1) . ": " . count($chunk) . " слов");
            
            foreach (array_chunk($chunk, 30) as $i => $subChunk) {
                $this->interpretChunk($baseUrl, $apiKey, $model, $subChunk, "{$chunkNum}.{$i}");
                $processed += count($subChunk);
                sleep(1);
            }
            
            $this->info("Прогресс: {$processed} / " . count($todo));
            
            // Сохраняем прогресс (удаляем обработанные из пула)
            $remaining = array_slice($pool, $processed);
            file_put_contents($poolFile, json_encode($remaining, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }

        $this->info("ГОТОВО! Обработано: {$processed}, всего записей: " . DreamSymbol::count());
        return self::SUCCESS;
    }

    private function norm(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = str_replace('ё', 'е', $s);
        $s = preg_replace('/\s+/u', ' ', $s);
        return trim($s);
    }

    private function generateWords(string $baseUrl, string $apiKey, string $model, string $category, int $count): array
    {
        $prompt = "Ты — составитель сонника. Верни СТРОГО JSON-массив без markdown из {$count} русских слов для категории «{$category}»: существительные в начальной форме (им. пад., ед. ч.), конкретные образы и понятия, которые могут присниться человеку. Без повторов, без пояснений, только массив строк.";

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

            $text = trim($resp->json('choices.0.message.content'));
            $s = strpos($text, '['); $e = strrpos($text, ']');
            if ($s !== false && $e !== false) $text = substr($text, $s, $e - $s + 1);
            $data = json_decode($text, true);
            if (!is_array($data)) return [];
            return array_values(array_map(fn($v, $k) => is_string($v) && $v !== '' ? $v : (string) $k, $data, array_keys($data)));
        } catch (\Throwable $e) {
            $this->warn("Слова «{$category}»: " . $e->getMessage());
            return [];
        }
    }

    private function interpretChunk(string $baseUrl, string $apiKey, string $model, array $chunk, string $tag): void
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
            if (!$resp->successful()) { $this->warn("Батч {$tag}: HTTP {$resp->status()}"); return; }

            $text = trim($resp->json('choices.0.message.content'));
            $s = strpos($text, '{'); $e = strrpos($text, '}');
            if ($s !== false && $e !== false) $text = substr($text, $s, $e - $s + 1);
            $data = json_decode($text, true);
            if (!is_array($data)) { $this->warn("Батч {$tag}: JSON не распознан"); return; }

            $saved = 0;
            foreach ($data as $kw => $interp) {
                $n = $this->norm((string) $kw);
                if ($n === '' || !is_string($interp) || mb_strlen(trim($interp)) < 10) continue;
                if (DreamSymbol::where('keyword', $n)->exists()) continue;
                DreamSymbol::create([
                    'keyword' => $n,
                    'interpretation' => trim($interp),
                    'ai_generated' => true,
                    'approved' => true,
                ]);
                $saved++;
            }
            $this->info("Батч {$tag}: сохранено {$saved}");
        } catch (\Throwable $e) {
            $this->warn("Батч {$tag}: " . $e->getMessage());
        }
    }
}
