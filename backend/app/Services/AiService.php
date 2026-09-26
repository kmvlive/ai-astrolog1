<?php

namespace App\Services;

use App\Models\BlogPost;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiService
{
    /**
     * Универсальный чат с AI
     */
    public function chat(string $prompt, array $options = []): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => $options['temperature'] ?? 0.85,
                    'max_tokens' => $options['max_tokens'] ?? 500,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($text) : null;
            }

            Log::error('AI chat error', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 500)]);
            return null;
        } catch (\Exception $e) {
            Log::error('AI chat exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function generateHoroscope(array $natalData, string $type, string $name): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

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
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }

            Log::error('Timeweb AI error', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 500)]);
            return null;
        } catch (\Exception $e) {
            Log::error('Timeweb AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function generateDailyHoroscope(string $signCode, string $signRu, $date, string $type = 'general', string $period = 'today'): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        $typeRu = $this->dailyTypeRu($type);
        $periodRu = $this->periodRu($period, $date);
        $length = $this->periodLength($period);

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — профессиональный астролог. Составляй гороскопы для знаков зодиака на русском языке. Тёплый, поддерживающий тон. Без заголовков, списков и эмодзи. Обращайся на "вы". СТРОГО ЗАПРЕЩЕНО: упоминать реальных людей (политиков, звёзд, учёных), конкретные даты событий, курсы валют, результаты матчей, выдумывать статистику и цитаты от реальных личностей. Используй только символические и психологические обобщения.'],
                        ['role' => 'user', 'content' => "Составь {$typeRu} {$periodRu} для знака {$signRu}. Учитывай характер знака и планетарные влияния. {$length}"],
                    ],
                    'temperature' => 0.9,
                    'max_tokens' => $this->periodMaxTokens($period),
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }

            Log::error('Daily horoscope error', ['sign' => $signCode, 'type' => $type, 'period' => $period, 'status' => $response->status()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Daily horoscope exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function dailyTypeRu(string $type): string
    {
        return match ($type) {
            'love' => 'гороскоп любви и отношений',
            'career' => 'гороскоп карьеры и работы',
            'financial' => 'финансовый гороскоп',
            'health' => 'гороскоп здоровья и самочувствия',
            'erotic' => 'гороскоп чувственности, романтики и страсти (деликатно, со вкусом, без пошлости)',
            'cooking' => 'кулинарный гороскоп: какие блюда готовить, какие вкусы в гармонии со знаком',
            'shopping' => 'гороскоп удачных покупок: что покупать, чего избегать, когда тратить',
            'beauty' => 'гороскоп красоты, ухода за собой и стиля',
            'jewelry' => 'ювелирный гороскоп: какие украшения, камни и металлы принесут удачу',
            default => 'общий гороскоп',
        };
    }

    private function periodRu(string $period, $date): string
    {
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        return match ($period) {
            'today' => "на сегодня ({$dateRu})",
            'tomorrow' => "на завтра (" . $date->copy()->addDay()->locale('ru')->isoFormat('D MMMM YYYY') . ")",
            'week' => 'на текущую неделю (с понедельника по воскресенье)',
            'month' => 'на текущий месяц',
            'year' => 'на текущий год',
            default => "на {$dateRu}",
        };
    }

    private function periodLength(string $period): string
    {
        return match ($period) {
            'today', 'tomorrow' => '2-3 абзаца.',
            'week' => '4-5 абзацев, раздели на будни и выходные.',
            'month' => '6-7 абзацев, упомяни ключевые недели.',
            'year' => '8-10 абзацев, раздели по сезонам.',
            default => '2-3 абзаца.',
        };
    }

    private function periodMaxTokens(string $period): int
    {
        return match ($period) {
            'today', 'tomorrow' => 600,
            'week' => 900,
            'month' => 1200,
            'year' => 1800,
            default => 600,
        };
    }

    /**
     * Генерация бесплатного гороскопа (китайский, японский, друидов и т.д.)
     */
    public function generateFreeHoroscope(string $system, string $sign, string $signName, \Carbon\Carbon $date): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) return null;

        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');
        [$sysPrompt, $userPrompt] = $this->buildFreePrompt($system, $signName, $dateRu);

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $sysPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.92,
                    'max_tokens' => 550,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }
            Log::error('Free horoscope error', ['system' => $system, 'sign' => $sign, 'status' => $response->status()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Free horoscope exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Совместимость двух знаков (один раз на пару)
     */
    public function generateCompatibility(string $name1, string $name2): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');
        if (!$apiKey) return null;

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — астролог-эксперт по совместимости знаков. Тёплый, вдохновляющий тон. Обращайся на "вы". СТРОГО ЗАПРЕЩЕНО: упоминать реальных людей (политиков, звёзд, учёных), конкретные даты событий, курсы валют, результаты матчей, выдумывать статистику и цитаты от реальных личностей. Используй только символические и психологические обобщения.'],
                        ['role' => 'user', 'content' => "Опиши совместимость знаков {$name1} и {$name2}: общие черты, сильные стороны пары, возможные сложности, советы для гармонии. 3-4 абзаца связного текста, без заголовков, списков и эмодзи."],
                    ],
                    'temperature' => 0.85,
                    'max_tokens' => 700,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Compatibility exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function buildFreePrompt(string $system, string $signName, string $dateRu): array
    {
        $sys = config("horoscope_systems.{$system}");
        $desc = $sys['description'] ?? '';

        $sysPrompts = [
            'chinese' => "Ты — мудрый китайский астролог, мастер восточной традиции. {$desc} Составляй прогнозы в духе восточной мудрости: плавный, поэтичный слог, метафоры стихий, отсылки к Инь-Ян. Тёплый, уважительный тон. Без списков, заголовков и эмодзи. 2-3 абзаца.",
            'japanese' => "Ты — японский оракул, мастер системы девяти звёзд Киу. {$desc} Составляй прогнозы в духе японской эстетики: утончённо, с образами природы, сезонности, гармонии. Тёплый тон. Без списков и эмодзи. 2-3 абзаца.",
            'zoroastrian' => "Ты — персидский мудрец-зороастриец. {$desc} Составляй прогнозы в духе древней мудрости Авесты: торжественно, с отсылками к огню, свету, добрым и злым духам. Тёплый тон. Без списков и эмодзи. 2-3 абзаца.",
            'druids' => "Ты — кельтский друид-оракул. {$desc} Составляй прогнозы мистически, с образами леса, корней, древних ритуалов. Тёплый, уважительный тон. Без списков и эмодзи. 2-3 абзаца.",
            'flowers' => "Ты — цветочный оракул. {$desc} Составляй прогнозы поэтично, с образами цветов, ароматов, садов. Тёплый, романтичный тон. Без списков и эмодзи. 2-3 абзаца.",
        ];

        $sysPrompt = $sysPrompts[$system] ?? 'Ты — профессиональный астролог. Тёплый тон. 2-3 абзаца без списков.';
        $userPrompt = "Составь прогноз на {$dateRu} для представителя знака {$signName}. Учитывай особенности знака и текущие планетарные влияния.";
        return [$sysPrompt, $userPrompt];
    }

    private function getSystemPrompt(): string
    {
        return "Ты — профессиональный астролог с 20-летним опытом. "
            . "Составляй тёплые, поддерживающие и конкретные гороскопы на русском языке. "
            . "Опирайся на предоставленную натальную карту. "
            . "Не давай медицинских и финансовых гарантий. "
            . "Формат: 3-4 абзаца связного текста, без заголовков, списков и эмодзи. "
            . "Обращайся к пользователю по имени.";
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

        $sun = $signsRu[$natalData['sun_sign'] ?? ''] ?? '?';
        $moon = $signsRu[$natalData['moon_sign'] ?? ''] ?? '?';
        $asc = $signsRu[$natalData['ascendant'] ?? ''] ?? '?';

        $planetLines = [];
        foreach (($natalData['planets'] ?? []) as $pname => $p) {
            $sign = $signsRu[$p['sign'] ?? ''] ?? '?';
            $retro = !empty($p['retrograde']) ? ' (ретроградная)' : '';
            $house = str_replace('_House', '', $p['house'] ?? '');

        $today = now()->locale('ru')->isoFormat('D MMMM YYYY');

        return "Пользователь: {$name}.\nДата: {$today}.\nНужен: " . ($typesRu[$type] ?? $typesRu['general']) . ".\n\n"
            . "Натальная карта:\nСолнце в {$sun}, Луна в {$moon}, Асцендент в {$asc}.\n"
            . "Положения планет:\n" . implode("\n", $planetLines) . "\n\n"
            . "Составь персональный гороскоп, учитывая конкретные положения планет. Обращайся по имени. 3-4 абзаца.";
    }
}

    public function generateBlogPost(): ?BlogPost
    {
        $today = now()->startOfDay();
        $existing = BlogPost::whereDate('published_at', $today)->where('author_type', 'ai')->first();
        if ($existing) return $existing;

        $moonData = $this->getMoonData($today);
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        $systemPrompt = <<<PROMPT
Ты — профессиональный астролог и писатель с 20-летним стажем. Пишешь ежедневную статью для блога "Астрологический дневник".

## Стиль
Тёплый, мудрый, практичный. Обращаешься на "вы". Даёшь конкретные советы, а не общие фразы.
Формат: Markdown. Используй заголовки ##, списки, цитаты, выделения.
Длина: 800-1200 слов.

## ВАЖНО: Разнообразие форматов
Каждый день выбирай СЛУЧАЙНЫЙ формат из списка (не повторяйся):

**Формат "Вопрос дня":**
- Заголовок как вопрос: "Что Луна шепчет вам сегодня?", "Готовы ли вы к перемене?"
- Статья = размышление + ответ

**Формат "История/притча":**
- Начинается с мини-истории (реальной или метафорической)
- Выводы в конце

**Формат "Письмо читателю":**
- Заголовок: "Дорогой друг, сегодня..."
- Личное обращение, интимный тон

**Формат "Практическое руководство":**
- Заголовок: "5 шагов к...", "Как использовать энергию дня для..."
- Чёткие инструкции

**Формат "Прогноз-размышление":**
- Заголовок: "Энергии {дата}: что нас ждёт", "Звёзды сегодня говорят о..."
- Анализ + советы

**Формат "Метафора дня":**
- Заголовок с ярким образом: "Когда Луна становится зеркалом", "День, когда звёзды танцуют"
- Статья строится вокруг этой метафоры

## Правила заголовка
- Заголовок должен быть КРЕАТИВНЫМ и УНИКАЛЬНЫМ
- НЕ начинай с "Ключевые энергии", "Энергии дня", "Астропрогноз"
- Используй вопросы, метафоры, обращения, образы
- Длина: 40-80 символов
- Первый заголовок ## в статье = это и есть заголовок (не пиши отдельный #)

## Структура (гибкая, не обязательно по пунктам)
- Атмосфера дня (учитывай фазу Луны и день недели)
- Главный фокус/вызов дня
- Практические советы (работа, отношения, здоровье)
- Что делать / чего избегать
- Напутствие или цитата

PROMPT;

        $recentTitles = BlogPost::where('author_type', 'ai')
            ->orderBy('published_at', 'desc')
            ->limit(7)
            ->pluck('title')
            ->implode("\n- ");
        $recentBlock = $recentTitles ? "\n\nВАЖНО: не повторяй эти темы и заголовки статей последних дней:\n- {$recentTitles}" : '';

        $userPrompt = "Дата: {$today->format('d.m.Y')} ({$this->weekdayRu($today)}).{$moonData}\n\nНапиши статью про энергии этого дня.{$recentBlock}";

        try {
            $response = Http::timeout(90)
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
                    'temperature' => 0.88,
                    'max_tokens' => 2000,
                    'enable_thinking' => false,
                ]);

            if (!$response->successful()) {
                Log::error('Blog AI error', ['status' => $response->status()]);
                return null;
            }

            $content = $response->json('choices.0.message.content');
            if (!$content) return null;

            $content = preg_replace('/^\s*#{1,6}\s+[^\n]+\n+/', '', trim($content), 1);
            $title = $this->extractTitle($content) ?: "Энергии дня: " . $today->translatedFormat('d F Y');

            // Защита от дублей заголовка (0 руб, без повторного AI)
            if (BlogPost::where('title', $title)->exists()) {
                $title .= ' — ' . $today->format('d.m.Y');
                Log::info('Blog AI: заголовок дублировался, добавлена дата', ['title' => $title]);
            }

            $slug = Str::slug($title) . '-' . $today->format('Ymd');

            $post = BlogPost::create([
                'title' => $title,
                'slug' => $slug,
                'excerpt' => mb_substr(strip_tags(Str::markdown($content)), 0, 160) . '…',
                'content' => $content,
                'author_type' => 'ai',
                'author_name' => 'AI-астролог',
                'published_at' => $today->setTime(7, 0),
                'blog_category_id' => 4, // Энергии дня
                'seo_title' => $title . ' — Блог AI-астролога',
                'seo_description' => mb_substr(strip_tags(Str::markdown($content)), 0, 150),
            ]);

            $coverData = $this->generateCover($post);
            if ($coverData) { 
                $post->update(['cover_image' => $coverData['path'], 'cover_subject' => $coverData['subject']]); 
                
            }

            return $post;
        } catch (\Exception $e) {
            Log::error('Blog AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function moonPhase($date): array
    {
        $timestamp = $date->timestamp;
        $synodicMonth = 2551443;
        $newMoonRef = 614088;
        $phase = fmod($timestamp - $newMoonRef, $synodicMonth) / $synodicMonth;

        $age = $phase * 29.53;
        $illumination = (1 - cos($phase * 2 * M_PI)) / 2 * 100;

        if ($age < 3.69) $phaseName = '🌑 Новолуние';
        elseif ($age < 11.07) $phaseName = '🌒 Растущий серп';
        elseif ($age < 14.77) $phaseName = '🌓 Первая четверть';
        elseif ($age < 18.45) $phaseName = '🌔 Растущая Луна';
        elseif ($age < 22.15) $phaseName = '🌕 Полнолуние';
        elseif ($age < 25.83) $phaseName = '🌖 Убывающая Луна';
        elseif ($age < 29.53) $phaseName = '🌗 Последняя четверть';
        else $phaseName = '🌘 Убывающий серп';

        return [$age, (int) round($illumination), $phaseName];
    }

    public function getMoonData($date): string
    {
        [$age, $illum, $phaseName] = $this->moonPhase($date);
        return "

Астроданные: {$phaseName}, возраст Луны " . round($age, 1) . " дней, освещённость {$illum}%.";
    }

    public function weekdayRu($date): string
    {
        return ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'][$date->dayOfWeek];
    }

    private function extractTitle(string $content): ?string
    {
        // Берём первый ## заголовок (это наш формат)
        if (preg_match('/^##\s*(.+)$/m', $content, $m)) {
            $title = trim($m[1]);
            // Проверка: если это шаблонный "Ключевые энергии" — берём следующий ##
            if (preg_match('/^(Ключевые энергии|Энергии дня|Астропрогноз)/u', $title)) {
                // Ищем второй ## заголовок
                if (preg_match_all('/^##\s*(.+)$/m', $content, $all)) {
                    foreach ($all[1] as $t) {
                        $t = trim($t);
                        if (!preg_match('/^(Ключевые энергии|Энергии дня|Астропрогноз)/u', $t) 
                            && mb_strlen($t) > 10 && mb_strlen($t) < 100) {
                            return $t;
                        }
                    }
                }
            }
            if (mb_strlen($title) > 10 && mb_strlen($title) < 100) {
                return $title;
            }
        }
        
        // Fallback: первая непустая непустая строка подходящей длины
        $lines = explode("\n", trim($content));
        foreach ($lines as $l) {
            $l = trim($l);
            if (mb_strlen($l) > 20 && mb_strlen($l) < 100 && !str_starts_with($l, '#')) {
                return $l;
            }
        }
        return null;
    }




    private const COVER_POOL = [
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a',
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564',
        'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3',
        'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e',
        'https://images.unsplash.com/photo-1502134249126-9f3755a50d78',
        'https://images.unsplash.com/photo-1532693322450-2cb5c511067d',
    ];

        public const COVER_PROMPTS = [
        // Природа и стихии
        'mystical lighthouse on a cliff with stormy waves',
        'ancient compass with glowing runes on parchment map',
        'ethereal moon path reflecting on still lake at night',
        'enchanted forest with bioluminescent mushrooms and fireflies',
        'majestic mountain peak with aurora borealis above',
        'serene waterfall cascading into crystal clear pool',
        'vast desert with lone dune and setting sun',
        'frozen glacier with blue ice caves and northern lights',
        'rainbow arching over misty valley after rain',
        'meteor shower streaking across starry sky',
        
        // Космос и время
        'lunar eclipse with blood moon and ancient temple silhouette',
        'solar eclipse corona with cosmic energy rays',
        'hourglass with golden sand flowing between dimensions',
        'vintage pocket watch with exposed gears showing time portals',
        'celestial clock tower with moon phases on its face',
        'cosmic spiral galaxy with nebula colors',
        'constellation map with zodiac symbols glowing',
        'black hole event horizon with accretion disk',
        'supernova explosion with colorful stellar debris',
        'parallel universe portal with swirling vortex',
        
        // Артефакты и символы
        'ancient key with ornate bow and glowing teeth',
        'crystal ball showing future visions inside',
        'tarot card spread on velvet cloth with candles',
        'runic stone circle with carved symbols',
        'alchemical flask with bubbling potion and steam',
        'golden chalice with overflowing wine and grapes',
        'sacred geometry mandala with intricate patterns',
        'dreamcatcher with feathers and beads against moonlight',
        'magic wand with sparkles and starlight trail',
        'ancient scroll with mysterious text and wax seal',
        
        // Архитектура и места
        'gothic cathedral with stained glass windows and candlelight',
        'abandoned castle ruins with ivy and moonbeams',
        'winding staircase leading to floating island in clouds',
        'bridge over misty chasm with lanterns on both sides',
        'hidden door in ancient library with glowing book',
        'secret garden with fountain and marble statues',
        'underground cave with crystal formations and underground river',
        'treehouse village in giant ancient tree with rope bridges',
        'floating islands with waterfalls and airships',
        'underwater city with bioluminescent buildings and fish',
        
        // Существа и духи
        'majestic phoenix rising from flames with golden feathers',
        'ethereal unicorn with flowing mane in enchanted forest',
        'wise owl with glowing eyes perched on ancient branch',
        'mystical raven with iridescent feathers and prophecy scroll',
        'graceful deer with antlers made of branches and stars',
        'powerful wolf howling at full moon on mountain peak',
        'majestic dragon with scales like gemstones breathing fire',
        'serene mermaid with flowing hair sitting on rock',
        'angelic figure with luminous wings and halo',
        'shadow creature with glowing eyes in dark alley',
        
        // Предметы и инструменты
        'ornate mirror with gilded frame showing alternate reality',
        'vintage telescope pointed at starry sky on rooftop',
        'ancient book with glowing pages and floating letters',
        'quill pen writing on parchment with magical ink',
        'candle flame with dancing shadows on wall',
        'lantern with warm glow illuminating cobblestone path',
        'compass rose with cardinal directions and mystical symbols',
        'sundial with shadow pointing to golden hour',
        'abacus with beads made of precious stones',
        'balance scale with feather on one side and heart on other',
        
        // Абстрактные концепции
        'yin yang symbol with flowing energy between black and white',
        'infinity symbol made of intertwined ribbons of light',
        'spiral staircase ascending into clouds and stars',
        'labyrinth with glowing path leading to center',
        'kaleidoscope pattern with shifting geometric shapes',
        'fractal tree with branches splitting infinitely',
        'golden ratio spiral with fibonacci sequence numbers',
        'mandala with intricate patterns radiating from center',
        'mobius strip with ants walking on infinite loop',
        'penrose triangle impossible shape in 3D space',
        
        // Сезоны и времена суток
        'spring cherry blossom tree with petals falling like snow',
        'summer beach with turquoise water and palm trees at sunset',
        'autumn forest with golden leaves and misty morning',
        'winter wonderland with snow covered trees and aurora',
        'dawn breaking over horizon with pastel colors',
        'golden hour sunlight streaming through forest canopy',
        'twilight with purple sky and first stars appearing',
        'midnight with full moon and fireflies in meadow',
        'eclipse moment with corona visible and stars out',
        'solstice celebration with bonfire and dancing shadows',
        
        // Эмоции и состояния
        'person meditating in lotus position with aura glowing',
        'dancer in flowing dress spinning with fabric trails',
        'artist painting on canvas with colors coming to life',
        'musician playing violin with sound waves visible',
        'writer at desk with words floating from pages',
        'warrior in armor with sword raised in victory',
        'healer with hands glowing while treating wounded',
        'explorer with map and compass in unknown land',
        'dreamer sleeping with visions floating above head',
        'lover embracing under starry sky with hearts floating',
    ];

    private function extractKeywords(string $text): string
    {
        // Берём 3-5 значимых слов из заголовка для уникальности промпта
        $stopWords = ['и', 'в', 'на', 'с', 'по', 'для', 'от', 'из', 'к', 'а', 'the', 'of', 'and', 'in', 'a'];
        $words = array_filter(preg_split('/[\s,.:;!?—–-]+/u', mb_strtolower($text)));
        $filtered = array_filter($words, fn($w) => !in_array($w, $stopWords) && mb_strlen($w) > 2);
        $keywords = array_slice(array_values($filtered), 0, min(5, count($filtered)));
        if (empty($keywords)) $keywords = array_slice(array_values($words), 0, 3);
        return implode(' ', $keywords);
    }

    private function getRandomPrompt(string $postTitle): string
    {
        // Получаем мотивы последних 45 постов для исключения повторов
        $recentSubjects = \App\Models\BlogPost::whereNotNull('cover_subject')
            ->orderByDesc('published_at')
            ->limit(45)
            ->pluck('cover_subject')
            ->toArray();
        
        // COVER_PROMPTS — плоский массив строк
        $allPrompts = self::COVER_PROMPTS;
        
        // Фильтруем: только те, которых нет в последних 45
        $availablePrompts = array_filter($allPrompts, function($p) use ($recentSubjects) {
            return !in_array($p, $recentSubjects);
        });
        
        // Если все использованы недавно — берём любой (цикл начнётся заново)
        if (empty($availablePrompts)) {
            $availablePrompts = $allPrompts;
        }
        
        // Выбираем случайный мотив из доступных
        $prompt = $availablePrompts[array_rand($availablePrompts)];

        $keyword = $this->extractKeywords($postTitle);

        // Уникальный seed для каждой генерации
        $seed = random_int(100000, 999999);
        
        // Стили и муды с ротацией (чтобы даже при повторе мотива композиция была другой)
        $styles = [
            'oil painting style', 'watercolor illustration', 'digital art',
            'art nouveau style', 'ethereal photography', 'concept art',
            'impressionist painting', 'surrealist art', 'fantasy illustration',
            'cinematic matte painting',
        ];
        $moods = ['serene', 'mystical', 'ethereal', 'majestic', 'tranquil', 'enchanting', 'celestial', 'luminous'];
        
        $style = $styles[array_rand($styles)];
        $mood = $moods[array_rand($moods)];

        return str_replace('{keyword}', $keyword, $prompt)
            . ", {$style}, {$mood} atmosphere, unique composition seed {$seed}"
            . ', masterpiece, highly detailed, cinematic lighting, no text, no watermark, no people';
    }

    private function generateViaTimeweb(string $prompt): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        if (!$apiKey) {
            Log::warning('Timeweb: API key не задан');
            return null;
        }

        try {
            $start = microtime(true);
            $resp = Http::timeout(60)->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->post("{$baseUrl}/images/generations", [
                'model' => 'black_forest_labs/flux-2-klein-9b',
                'prompt' => $prompt,
                'size' => '1024x1024',
                'n' => 1,
            ]);
            $sec = round(microtime(true) - $start, 1);

            if ($resp->status() !== 200) {
                Log::warning('Timeweb: ошибка', ['status' => $resp->status(), 'body' => substr($resp->body(), 0, 300)]);
                return null;
            }

            $data = $resp->json();
            $img = $data['data'][0] ?? null;
            if (!$img) return null;

            // Если есть URL — скачиваем
            if (!empty($img['url'])) {
                $download = Http::timeout(30)->get($img['url']);
                if ($download->successful() && strlen($download->body()) > 30000) {
                    Log::info("Timeweb: сгенерировано за {$sec} сек");
                    return $this->webpToJpeg($download->body(), 1200, 800);
                }
            }

            // Если только base64
            if (!empty($img['b64_json'])) {
                $raw = base64_decode($img['b64_json']);
                if ($raw && strlen($raw) > 30000) {
                    Log::info("Timeweb: сгенерировано за {$sec} сек (base64)");
                    return $this->webpToJpeg($raw, 1200, 800);
                }
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning('Timeweb исключение', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function generateViaStableHorde(string $prompt): ?string
    {
        $base = 'https://stablehorde.net/api/v2';
        $apikey = env('STABLE_HORDE_KEY', '0000000000');
        $headers = ['apikey' => $apikey, 'Client-Agent' => 'neiro-astro:1.0:admin'];

        try {
            $resp = Http::timeout(30)->withHeaders($headers)->post("$base/generate/async", [
                'prompt' => $prompt,
                'params' => [
                    'width' => 1024,
                    'height' => 1024,
                    'steps' => 28,
                    'cfg_scale' => 7.5,
                    'sampler_name' => 'k_dpmpp_2m',
                    'hires_fix' => true,
                    'negative_prompt' => 'text, watermark, logo, signature, words, letters, username, ugly, deformed, blurry, low quality, amateur, dark, gloomy, scary, human, face, person, body, silhouette',
                ],
                'models' => ['AlbedoBase XL (SDXL)'],
                'nsfw' => false,
            ]);

            $id = $resp->json('id');
            if (!$id) {
                Log::warning('StableHorde: нет id', ['status' => $resp->status(), 'body' => substr($resp->body(), 0, 300)]);
                return null;
            }

            // Ждём результат до ~70 секунд
            for ($i = 0; $i < 14; $i++) {
                sleep(5);
                $st = Http::timeout(15)->withHeaders($headers)->get("$base/generate/status/$id");
                if (!$st->successful()) continue;
                $data = $st->json();
                if ($data['faulted'] ?? false) return null;
                if (($data['done'] ?? false) && !empty($data['generations'][0]['img'])) {
                    $raw = base64_decode($data['generations'][0]['img']);
                    return $this->webpToJpeg($raw, 1200, 800);
                }
            }
            Log::warning('StableHorde: таймаут ожидания', ['id' => $id]);
            return null;
        } catch (\Throwable $e) {
            Log::warning('StableHorde исключение', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function webpToJpeg(string $raw, int $w, int $h): ?string
    {
        $img = @imagecreatefromstring($raw);
        if (!$img) return null;
        $resized = imagescale($img, $w, $h);
        if (!$resized) { imagedestroy($img); return null; }
        ob_start();
        imagejpeg($resized, null, 90);
        $out = ob_get_clean();
        imagedestroy($img);
        imagedestroy($resized);
        return $out ?: null;
    }

    public function generateCover(BlogPost $post): ?array
    {
        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        $disk->makeDirectory('blog-covers');

        // Выбираем промпт ОДИН раз и сохраняем его для ротации
        $prompt = $this->getRandomPrompt($post->title);

        // 0) Timeweb AI: быстрый Flux (4-10 сек)
        for ($i = 0; $i < 2; $i++) {
            $raw = $this->generateViaTimeweb($prompt);
            if ($raw && strlen($raw) > 30000) {
                $suffix = substr(md5(time() . random_int(1000, 9999)), 0, 8);
                $file = 'blog-covers/' . $post->slug . '-' . $suffix . '.jpg';
                $disk->put($file, $raw);
                return ['path' => $file, 'subject' => $prompt];
            }
        }

        // 2) Запасной: космос из подборки Unsplash
        $start = random_int(0, count(self::COVER_POOL) - 1);
        for ($i = 0; $i < 3; $i++) {
            $url = self::COVER_POOL[($start + $i) % count(self::COVER_POOL)] . "?w=1200&h=800&fit=crop&q=80&fm=jpg";
            try {
                $resp = Http::timeout(20)->get($url);
                $ct = (string) $resp->header('Content-Type');
                if ($resp->successful() && strlen($resp->body()) > 30000 && str_contains($ct, 'image')) {
                    $file = 'blog-covers/' . $post->slug . '.jpg';
                    $disk->put($file, $resp->body());
                    return ['path' => $file, 'subject' => 'unsplash_fallback'];
                }
            } catch (\Throwable $e) {}
        }

        // 3) Последний запасной: SVG с фазой Луны
        $suffix = substr(md5(time() . random_int(1000, 9999)), 0, 8);
        $file = 'blog-covers/' . $post->slug . '-' . $suffix . '.svg';
        $disk->put($file, $this->renderSvgCover($post));
        return ['path' => $file, 'subject' => 'svg_fallback'];
    }

    private function removeWatermark(string $imageData): string
    {
        try {
            $img = @imagecreatefromstring($imageData);
            if (!$img) return $imageData;

            $width = imagesx($img);
            $height = imagesy($img);

            // Pollinations ставит логотип в нижних ~64px — обрезаем 80px с запасом
            $cropHeight = max($height - 80, (int)($height * 0.9));
            $cropped = imagecrop($img, ['x' => 0, 'y' => 0, 'width' => $width, 'height' => $cropHeight]);
            if (!$cropped) {
                imagedestroy($img);
                return $imageData;
            }

            ob_start();
            imagejpeg($cropped, null, 90);
            $result = ob_get_clean();

            imagedestroy($img);
            imagedestroy($cropped);

            return $result && strlen($result) > 30000 ? $result : $imageData;
        } catch (\Throwable $e) {
            Log::warning('Cover: removeWatermark failed', ['error' => $e->getMessage()]);
            return $imageData;
        }
    }

    private function renderSvgCover(BlogPost $post): string
    {
        mt_srand(crc32($post->slug));
        $stars = '';
        for ($i = 0; $i < 110; $i++) {
            $x = mt_rand(0, 1200); $y = mt_rand(0, 800);
            $r = mt_rand(4, 22) / 10;
            $o = number_format(mt_rand(25, 100) / 100, 2, '.', '');
            $stars .= "<circle cx='{$x}' cy='{$y}' r='{$r}' fill='#ffffff' opacity='{$o}'/>";
        }
        for ($i = 0; $i < 8; $i++) {
            $x = mt_rand(40, 1160); $y = mt_rand(40, 720); $s = mt_rand(7, 14); $t = intdiv($s, 3);
            $stars .= "<path d='M{$x} " . ($y - $s) . " L" . ($x + $t) . " " . ($y - $t) . " L" . ($x + $s) . " {$y} L" . ($x + $t) . " " . ($y + $t) . " L{$x} " . ($y + $s) . " L" . ($x - $t) . " " . ($y + $t) . " L" . ($x - $s) . " {$y} L" . ($x - $t) . " " . ($y - $t) . " Z' fill='#ffe9a8' opacity='0.85'/>";
        }

        [$age, $illum, $phaseName] = $this->moonPhase($post->published_at ?? now());
        $shadowX = (int) round(900 + (($age / 29.53) * 2 - 1) * 70);

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="0.5" stop-color="#4c1d95"/><stop offset="1" stop-color="#2e1065"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#fef3c7" stop-opacity="0.9"/><stop offset="0.4" stop-color="#fcd34d" stop-opacity="0.3"/><stop offset="1" stop-color="#fcd34d" stop-opacity="0"/></radialGradient>
<radialGradient id="moon" cx="0.4" cy="0.4" r="0.8"><stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#fde68a"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<rect width="1200" height="800" fill="url(#bg)"/>
<ellipse cx="250" cy="640" rx="300" ry="180" fill="#7c3aed" opacity="0.25" filter="url(#blur)"/>
<ellipse cx="950" cy="120" rx="280" ry="160" fill="#db2777" opacity="0.16" filter="url(#blur)"/>
{$stars}
<circle cx="900" cy="220" r="170" fill="url(#glow)"/>
<circle cx="900" cy="220" r="80" fill="url(#moon)"/>
<circle cx="{$shadowX}" cy="212" r="76" fill="#241d5c" opacity="0.95"/>
<text x="60" y="760" font-family="Georgia, serif" font-size="32" fill="#e9d5ff" opacity="0.9">{$phaseName} • Луна освещена на {$illum}%</text>
</svg>
SVG;
    }


    /**
     * Очищает AI-текст от артефактов: иероглифы, лишние пробелы, маркдаун
     */
    private function cleanAiText(string $text): string
    {
        // Удаляем CJK-иероглифы (китайский, японский, корейский)
        $text = preg_replace("/[\x{4E00}-\x{9FFF}\x{3400}-\x{4DBF}\x{F900}-\x{FAFF}]+/u", "", $text);
        
        // Удаляем артефакты форматирования
        $text = preg_replace('/^#+\s*/m', '', $text); // заголовки # ## ###
        $text = preg_replace('/\*\*([^*]+)\*\*/', '$1', $text); // **жирный**
        $text = preg_replace('/\*([^*]+)\*/', '$1', $text); // *курсив*
        $text = preg_replace('/`([^`]+)`/', '$1', $text); // `код`
        
        // Нормализуем пробелы
        $text = preg_replace('/ {2,}/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        
        return trim($text);
    }


    public function generateBiorhythmAdvice(int $physical, int $emotional, int $intellectual, int $average): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(45)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — заботливый наставник по саморазвитию. Давай короткие (3-5 предложений) практические советы на день на основе биоритмов человека. Тёплый, поддерживающий тон на "ты". Без заголовков, списков и эмодзи. СТРОГО ЗАПРЕЩЕНО: упоминать реальных людей (политиков, звёзд, учёных), конкретные даты событий, курсы валют, результаты матчей, выдумывать статистику и цитаты от реальных личностей. Используй только символические и психологические обобщения.'],
                        ['role' => 'user', 'content' => "Мои биоритмы сегодня: физический {$physical}%, эмоциональный {$emotional}%, интеллектуальный {$intellectual}%, общий {$average}%. Что мне делать, чего избегать, на чём сосредоточиться?"],
                    ],
                    'temperature' => 0.85,
                    'max_tokens' => 400,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }

            Log::error('Biorhythm AI error', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 300)]);
            return null;
        } catch (\Exception $e) {
            Log::error('Biorhythm AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }


    public function generateDreamInterpretation(string $keyword): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(45)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — мудрый толкователь снов. Давай короткие (1-2 предложения) символические толкования на русском языке. СТРОГО ЗАПРЕЩЕНО упоминать учёных (Фрейд, Юнг), исследования, статистику. Без заголовков, списков и эмодзи.'],
                        ['role' => 'user', 'content' => "К чему снится: {$keyword}? Дай краткое тёплое толкование."],
                    ],
                    'temperature' => 0.8,
                    'max_tokens' => 300,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Dream AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }


    public function generateNameMeaning(string $name): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — эксперт по ономастике и истории имён. Пиши тёплый, живой текст на русском языке. Без списков, без эмодзи, без заголовков. Пиши связными абзацами.'],
                        ['role' => 'user', 'content' => "Расскажи про имя «{$name}»: происхождение и этимология, значение, черты характера носителей, астрологические соответствия (знак зодиака, планета, цвет, камень), роль имени в современном мире. СТРОГО ЗАПРЕЩЕНО упоминать конкретных исторических или современных личностей (писателей, учёных, актёров, политиков). Напиши 4-5 абзацев тёплого связного текста."],
                    ],
                    'temperature' => 0.75,
                    'max_tokens' => 800,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }
            return null;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI name meaning error: ' . $e->getMessage());
            return null;
        }
    }

    public function detectNameOrigin(string $name): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — эксперт по ономастике. Определяй происхождение имён. Отвечай ОДНИМ словом из списка: славянское, греческое, еврейское, латинское, германское, арабское, тюркское, скандинавское, кельтское, персидское, индийское.'],
                        ['role' => 'user', 'content' => "Происхождение имени «{$name}»? Ответь одним словом."],
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 50,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = trim($response->json('choices.0.message.content') ?? '');
                $allowed = ['славянское', 'греческое', 'еврейское', 'латинское', 'германское', 'арабское', 'тюркское', 'скандинавское', 'кельтское', 'персидское', 'индийское'];
                foreach ($allowed as $origin) {
                    if (mb_strpos(mb_strtolower($text), $origin) !== false) {
                        return $origin;
                    }
                }
                return $text ?: 'неизвестное';
            }
            return null;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI detectNameOrigin error: ' . $e->getMessage());
            return null;
        }
    }

    public function analyzeNameCompatibility(string $name1, string $name2): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Ты — эксперт по ономастике и совместимости имён. Пиши тёплый, живой текст на русском языке. Без списков, без эмодзи, без заголовков. Пиши связными абзацами. СТРОГО ЗАПРЕЩЕНО: упоминать реальных людей (политиков, звёзд, учёных), конкретные даты событий, курсы валют, результаты матчей, выдумывать статистику и цитаты от реальных личностей. Используй только символические и психологические обобщения.'],
                        ['role' => 'user', 'content' => "Проанализируй совместимость имён «{$name1}» и «{$name2}»: как они сочетаются в романтических отношениях, в дружбе, в деловом партнёрстве. Какие черты характеров могут дополнять друг друга, а какие — конфликтовать. Напиши 3-5 абзацев тёплого текста."],
                    ],
                    'temperature' => 0.75,
                    'max_tokens' => 800,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }
            return null;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI name compatibility error: ' . $e->getMessage());
            return null;
        }
    }


    public function generateNatalChartInterpretation(\App\Models\NatalChart $chart): ?string
    {
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');
        $model = env('TIMEWEB_AI_MODEL', 'dashscope/qwen3.5-flash');

        if (!$apiKey) return null;

        $user = $chart->user;
        $name = $user->name ?: 'дорогой друг';
        $birthDate = $chart->birth_date?->locale('ru')->isoFormat('D MMMM YYYY') ?? 'не указана';
        $birthTime = $chart->birth_time ?? 'не указано';
        $gender = $chart->gender === 'female' ? 'женщина' : ($chart->gender === 'male' ? 'мужчина' : 'человек');
        $city = $chart->city ?? 'не указан';

        // Определяем знак солнца по дате рождения
        $sunSign = $this->getSunSign($chart->birth_date);
        $sunSignRu = $this->signsRu()[$sunSign] ?? 'не определён';

        $systemPrompt = <<<PROMPT
Ты — профессиональный астролог с 25-летним опытом, эксперт по натальным картам. 
Твоя задача — составить глубокую, подробную и тёплую интерпретацию натальной карты.
Пиши на русском языке, обращайтесь к клиенту по имени на "вы".
Тон: мудрый, поддерживающий, конкретный, без общих фраз.
Формат: используй Markdown с заголовками ## для разделов.
Не давай медицинских диагнозов и финансовых гарантий.
Объём: 2500-3500 слов. Это платная услуга, текст должен быть максимально ценным и подробным.
PROMPT;

        $userPrompt = <<<PROMPT
Составь полную интерпретацию натальной карты для клиента.

Данные клиента:
- Имя: {$name}
- Пол: {$gender}
- Дата рождения: {$birthDate}
- Время рождения: {$birthTime}
- Город: {$city}
- Солнечный знак: {$sunSignRu}

Структура интерпретации (каждый раздел раскрой подробно, 3-5 абзацев):

## 🌟 Ваш космический портрет
Общая характеристика личности на основе солнечного знака, стихии и креста. Какой вы человек в целом, ваша суть.

## 🧠 Характер и психотип
Глубокий разбор характера: как вы мыслите, принимаете решения, реагируете на стресс. Ваши врождённые паттерны поведения. Сильные стороны характера и то, что может мешать.

## 💪 Сильные стороны и таланты
Ваши природные дары и способности. В чём вы особенно хороши, какие таланты заложены в вашей карте. Как их развивать и использовать.

## 🌱 Зоны роста
Над чем стоит работать. Какие слабости можно трансформировать в силу. Конкретные рекомендации по саморазвитию.

## 💕 Отношения и любовь
Как вы любите и чего ждёте от партнёра. Ваш стиль в отношениях. Какой партнёр вам подходит. Возможные сложности в любви и как их преодолеть.

## 💼 Карьера и предназначение
Какие профессии и сферы деятельности вам подходят. Ваш путь к успеху. Предназначение — зачем вы пришли в этот мир. Как реализовать свой потенциал.

## 💰 Деньги и финансы
Ваше отношение к деньгам. Как вы зарабатываете и тратите. Финансовые сильные стороны и риски. Рекомендации по улучшению финансового положения.

## 🏠 Семья и быт
Как вы ведёте себя в семье. Роль в семейной системе. Отношения с родителями. Какой вы хозяин/хозяйка. Рекомендации для гармонии в доме.

## 🎭 Эмоциональное состояние
Ваш эмоциональный мир. Как вы переживаете чувства. Что даёт ресурс, что истощает. Как поддерживать эмоциональный баланс.

## 🔮 Практические рекомендации
Конкретные советы на ближайший период. Что делать, чего избегать. Ритуалы и практики для усиления сильных сторон. Камни, цвета, дни недели которые вам благоприятны.

PROMPT;

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(120)
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
                    'temperature' => 0.82,
                    'max_tokens' => 4000,
                    'enable_thinking' => false,
                ]);

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content');
                return $text ? trim($this->cleanAiText($text)) : null;
            }

            Log::error('Natal chart AI error', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 500)]);
            return null;
        } catch (\Exception $e) {
            Log::error('Natal chart AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function getSunSign(?\Carbon\Carbon $date): string
    {
        if (!$date) return 'Ari';
        $d = $date->format('n-j');
        if ($d >= '3-21' && $d <= '4-19') return 'Ari';
        if ($d >= '4-20' && $d <= '5-20') return 'Tau';
        if ($d >= '5-21' && $d <= '6-20') return 'Gem';
        if ($d >= '6-21' && $d <= '7-22') return 'Can';
        if ($d >= '7-23' && $d <= '8-22') return 'Leo';
        if ($d >= '8-23' && $d <= '9-22') return 'Vir';
        if ($d >= '9-23' && $d <= '10-22') return 'Lib';
        if ($d >= '10-23' && $d <= '11-21') return 'Sco';
        if ($d >= '11-22' && $d <= '12-21') return 'Sag';
        if ($d >= '12-22' || $d <= '1-19') return 'Cap';
        if ($d >= '1-20' && $d <= '2-18') return 'Aqu';
        return 'Pis';
    }

    private function signsRu(): array
    {
        return [
            'Ari' => 'Овен', 'Tau' => 'Телец', 'Gem' => 'Близнецы',
            'Can' => 'Рак', 'Leo' => 'Лев', 'Vir' => 'Дева',
            'Lib' => 'Весы', 'Sco' => 'Скорпион', 'Sag' => 'Стрелец',
            'Cap' => 'Козерог', 'Aqu' => 'Водолей', 'Pis' => 'Рыбы',
        ];
    }


    /**
     * Извлекает мотив обложки для сохранения в cover_subject
     */

}
