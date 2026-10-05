<?php

namespace App\Console\Commands;

use App\Models\DreamSymbol;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class DreamsFixGrammar extends Command
{
    protected $signature = 'dreams:fix-grammar';
    protected $description = 'LLM-редактор: чинит грамматику двусловных заголовков в БД и пуле';

    public function handle(): int
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        // собираем двусловные из БД и пула
        $dbKeywords = DreamSymbol::pluck('keyword')->all();
        $dbSet = array_flip($dbKeywords);
        $candidates = [];
        foreach ($dbKeywords as $k) {
            if (count(explode(' ', $k)) === 2) $candidates[$k] = 'db';
        }
        $poolFile = storage_path('app/dreams-pool.json');
        $pool = json_decode(file_get_contents($poolFile), true) ?: [];
        foreach ($pool as $k) {
            if (count(explode(' ', $k)) === 2 && !isset($dbSet[$k])) $candidates[$k] = 'pool';
        }
        $list = array_keys($candidates);
        $this->info('Двусловных на проверку: ' . count($list) . ' (БД+пул)');

        // прогоняем батчами через модель
        $fixMap = [];
        foreach (array_chunk($list, 60) as $n => $chunk) {
            $prompt = "Ты — редактор сонника. Дан список заголовков статей. Некоторые грамматически искажены: неверный род, число, падеж, форма слова (примеры искажений: 'сумчатый мышь', 'из ружье', 'соевый бобы', 'молочное железа', 'из артиллерийский'). Верни СТРОГО JSON-объект без markdown: искажённый заголовок -> правильная естественная форма (как пользователь ищет в соннике). Включай ТОЛЬКО изменённые. Правильные заголовки не включай. Заголовки:\n" . implode("\n", $chunk);

            try {
                $resp = Http::timeout(120)->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'temperature' => 0.2,
                    'max_tokens' => 3000,
                    'enable_thinking' => false,
                ]);
                if (!$resp->successful()) { $this->warn("Батч {$n}: HTTP {$resp->status()}"); continue; }

                $text = trim($resp->json('choices.0.message.content'));
                $s = strpos($text, '{'); $e = strrpos($text, '}');
                if ($s !== false && $e !== false) $text = substr($text, $s, $e - $s + 1);
                $data = json_decode($text, true);
                if (!is_array($data)) { $this->warn("Батч {$n}: JSON не распознан"); continue; }

                $fixed = 0;
                foreach ($data as $old => $new) {
                    $old = mb_strtolower(trim((string) $old));
                    $new = mb_strtolower(trim((string) $new));
                    $new = str_replace('ё', 'е', $new);
                    $new = preg_replace('/\s+/u', ' ', $new);
                    if ($old && $new && $new !== $old && isset($candidates[$old])) {
                        $fixMap[$old] = $new;
                        $fixed++;
                        if ($fixed <= 10) $this->line("   {$old} -> {$new}");
                    }
                }
                $this->info("Батч {$n}: исправлено {$fixed}");
            } catch (\Throwable $e) {
                $this->warn("Батч {$n}: " . $e->getMessage());
            }
            sleep(1);
        }
        $this->info('Всего исправлений: ' . count($fixMap));

        // применяем к БД
        $dbSetNow = array_flip(DreamSymbol::pluck('keyword')->all());
        $renamed = 0; $deleted = 0;
        foreach ($fixMap as $old => $new) {
            if (!isset($dbSetNow[$old])) continue;
            if (isset($dbSetNow[$new])) {
                DreamSymbol::where('keyword', $old)->delete();
                $deleted++;
            } else {
                DreamSymbol::where('keyword', $old)->update(['keyword' => $new]);
                $dbSetNow[$new] = true;
                unset($dbSetNow[$old]);
                $renamed++;
            }
        }
        $this->info("БД: переименовано {$renamed}, удалено дублей {$deleted}");

        // применяем к пулу
        $newPool = []; $seen = [];
        foreach ($pool as $w) {
            $w = $fixMap[$w] ?? $w;
            if (isset($dbSetNow[$w]) || isset($seen[$w])) continue;
            $seen[$w] = true;
            $newPool[] = $w;
        }
        file_put_contents($poolFile, json_encode($newPool, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $this->info('Пул: было ' . count($pool) . ', стало ' . count($newPool));

        return self::SUCCESS;
    }
}
