<?php

namespace App\Console\Commands;

use App\Models\DreamSymbol;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use pymorphy3\MorphAnalyzer;

class DreamsFilterAdjf extends Command
{
    protected $signature = 'dreams:filter-adjf';
    protected $description = 'LLM-фильтр одиночных прилагательных: оставляет только те, что объект сна';

    public function handle(): int
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        // собираем ADJF-одиночные
        $morph = new MorphAnalyzer();
        $adjf = [];
        foreach (DreamSymbol::pluck('keyword') as $kw) {
            if (str_contains($kw, ' ')) continue;
            $p = $morph->parse($kw)[0];
            if (in_array('ADJF', $p->tag->grammemes) && $p->score > 0.5) {
                $adjf[] = $kw;
            }
        }
        $this->info('ADJF-одиночных: ' . count($adjf));

        $toDelete = [];
        foreach (array_chunk($adjf, 100) as $n => $chunk) {
            $prompt = "Ты — редактор сонника. Дан список одиночных прилагательных. Оставь только те, которые являются самостоятельными объектами сна (например: 'бывшая' (девушка), 'новорожденный' (ребенок), 'колыбельная' (песня), 'кондитерская' (магазин)). Удали те, которые требуют уточнения (например: 'брюссельская' (капуста?), 'пекинская' (утка?), 'буровая' (установка?)). Верни СТРОГО JSON-массив слов для УДАЛЕНИЯ. Слова:\n" . implode(', ', $chunk);

            try {
                $resp = Http::timeout(120)->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                ])->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'temperature' => 0.2,
                    'max_tokens' => 2000,
                ]);
                if (!$resp->successful()) { $this->warn("Батч {$n}: HTTP {$resp->status()}"); continue; }

                $text = trim($resp->json('choices.0.message.content'));
                $s = strpos($text, '['); $e = strrpos($text, ']');
                if ($s !== false && $e !== false) $text = substr($text, $s, $e - $s + 1);
                $data = json_decode($text, true);
                if (!is_array($data)) { $this->warn("Батч {$n}: JSON не распознан"); continue; }

                foreach ($data as $w) {
                    if (is_string($w) && in_array($w, $chunk)) $toDelete[] = $w;
                }
                $this->info("Батч {$n}: к удалению " . count($data));
            } catch (\Throwable $e) {
                $this->warn("Батч {$n}: " . $e->getMessage());
            }
            sleep(1);
        }
        $this->info('Всего к удалению: ' . count($toDelete));

        $del = DreamSymbol::whereIn('keyword', $toDelete)->delete();
        $this->info("Удалено из БД: {$del}");
        $this->info('Осталось: ' . DreamSymbol::count());

        return self::SUCCESS;
    }
}
