<?php

namespace App\Console\Commands;

use App\Models\Affirmation;
use App\Services\AiService;
use Illuminate\Console\Command;

class GenerateDailyAffirmation extends Command
{
    protected $signature = 'affirmation:generate-daily';
    protected $description = 'Генерирует ежедневную аффирмацию';

    public function handle(AiService $ai): int
    {
        $today = now()->startOfDay();
        
        // Проверяем есть ли уже на сегодня
        $existing = Affirmation::forDate($today)->first();
        if ($existing) {
            $this->info("Аффирмация на сегодня уже есть: {$existing->title}");
            return 0;
        }

        $this->info('Генерация аффирмации...');
        
        $moonData = $ai->getMoonData($today);
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) {
            $this->error('Нет TIMEWEB_AI_API_KEY');
            return 1;
        }

        $systemPrompt = <<<PROMPT
Ты — эксперт по позитивной психологии и астрологии. Создаёшь ежедневную аффирмацию для русскоязычной аудитории.

Стиль: тёплый, вдохновляющий, конкретный. Обращаешься на "ты".
Формат: JSON с полями title (короткий заголовок 3-6 слов) и description (развёрнутое описание 80-120 слов).

Аффирмация должна:
- Учитывать энергии дня (на основе данных Луны)
- Быть практичной и применимой в жизни
- Давать конкретную установку на день
- Звучать естественно, не шаблонно

PROMPT;

        $userPrompt = "Дата: {$today->format('d.m.Y')} ({$ai->weekdayRu($today)}). {$moonData}\n\nСоздай аффирмацию на этот день.";

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.8,
                    'max_tokens' => 500,
                    'enable_thinking' => false,
                ]);

            if (!$response->successful()) {
                $this->error("HTTP {$response->status()}");
                return 1;
            }

            $content = $response->json('choices.0.message.content');
            $data = json_decode($content, true);
            
            if (!$data || !isset($data['title']) || !isset($data['description'])) {
                $this->error('Невалидный JSON от AI');
                return 1;
            }

            $affirmation = Affirmation::create([
                'date' => $today,
                'title' => $data['title'],
                'description' => $data['description'],
            ]);

            $this->info("✓ Аффирмация создана: {$affirmation->title}");
            return 0;

        } catch (\Exception $e) {
            $this->error("Ошибка: {$e->getMessage()}");
            return 1;
        }
    }
}
