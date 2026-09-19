<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\DivinationResult;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class DivinationController extends Controller
{

    private const RUNES_MAP = [
            'феху' => 'fehu', 'fehu' => 'fehu',
            'уруз' => 'uruz', 'uruz' => 'uruz',
            'турисаз' => 'thurisaz', 'thurisaz' => 'thurisaz', 'турисаз' => 'thurisaz',
            'ансуз' => 'ansuz', 'ansuz' => 'ansuz',
            'райдо' => 'raidho', 'raidho' => 'raidho', 'райто' => 'raidho',
            'кеназ' => 'kenaz', 'kenaz' => 'kenaz', 'кеназ' => 'kenaz',
            'гебо' => 'gebo', 'gebo' => 'gebo',
            'вуньо' => 'wunjo', 'wunjo' => 'wunjo', 'вуньо' => 'wunjo',
            'хагалаз' => 'hagalaz', 'hagalaz' => 'hagalaz',
            'наудиз' => 'naudiz', 'naudiz' => 'naudiz',
            'иса' => 'isa', 'isa' => 'isa',
            'йера' => 'jera', 'jera' => 'jera', 'джер' => 'jera',
            'эйваз' => 'eihwaz', 'eihwaz' => 'eihwaz', 'иваз' => 'eihwaz',
            'перт' => 'perthro', 'perthro' => 'perthro', 'пертро' => 'perthro',
            'альгиз' => 'algiz', 'algiz' => 'algiz',
            'совило' => 'sowilo', 'sowilo' => 'sowilo', 'соулу' => 'sowilo', 'совелу' => 'sowilo',
            'тейваз' => 'tiwaz', 'tiwaz' => 'tiwaz', 'тиваз' => 'tiwaz',
            'беркана' => 'berkano', 'berkano' => 'berkano', 'беркана' => 'berkano',
            'эваз' => 'ehwaz', 'ehwaz' => 'ehwaz',
            'манназ' => 'mannaz', 'mannaz' => 'mannaz',
            'лагуз' => 'laguz', 'laguz' => 'laguz',
            'ингуз' => 'ingwaz', 'ingwaz' => 'ingwaz', 'ингваз' => 'ingwaz',
            'дагаз' => 'dagaz', 'dagaz' => 'dagaz',
            'отала' => 'othala', 'othala' => 'othala', 'отала' => 'othala',
        ];

    public function predict(Request $request, string $type)
    {
        $question = (string) $request->input('question', '');
        $extra = (array) $request->input('extra', []);

        $userId = $this->resolveUserId($request);

        $cacheKey = "divination_{$type}_" . md5($question . json_encode($extra) . now()->format('Y-m-d-H-i'));

        return Cache::remember($cacheKey, 60, function () use ($type, $question, $extra, $userId) {
            // Гарантируем типы внутри closure
            $question = (string) $question;
            $extra = (array) $extra;

            // Лимит токенов по сложности расклада
            $maxTokens = [
                'celtic-cross' => 2200,
                'tarot-future' => 1600,
                'tarot-love' => 1200,
                'runes' => 1200,
                'coffee-grounds' => 1200,
                'tarot-birthdate' => 1000,
            ][$type] ?? 900;
            
            $ai = app(AiService::class);
            $prompt = $this->buildPrompt($type, $question, $extra);

            try {
                $response = $ai->chat($prompt, [
                    'temperature' => 0.9,
                    'max_tokens' => $maxTokens,
                ]);

                if (!$response) throw new \Exception('AI returned null');

                $extracted = $this->extractCards($response, $type);
                $cleanPrediction = $extracted['prediction'];
                $cards = $extracted['cards'];
                
                $row = DivinationResult::create([
                    'type' => $type,
                    'question' => $question,
                    'prediction' => $cleanPrediction,
                    'user_id' => $userId,
                ]);
                return response()->json([
                    'prediction' => $cleanPrediction,
                    'cards' => $cards,
                    'type' => $type,
                    'timestamp' => now()->toISOString(),
                    'uuid' => $row->uuid,
                ]);
            } catch (\Exception $e) {
                Log::error("Divination {$type} error", ['error' => $e->getMessage()]);
                $fallbackText = $this->getFallback($type);
                $row = DivinationResult::create([
                    'type' => $type,
                    'question' => $question,
                    'prediction' => $fallbackText,
                    'user_id' => $userId,
                ]);
                return response()->json([
                    'prediction' => $fallbackText,
                    'type' => $type,
                    'timestamp' => now()->toISOString(),
                    'fallback' => true,
                    'uuid' => $row->uuid,
                ]);
            }
        });
    }


    public function history(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'unauthorized'], 401);

        $rows = DivinationResult::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['uuid', 'type', 'question', 'prediction', 'created_at']);

        $types = [
            'tarot-yes-no' => ['name' => 'Таро Да/Нет', 'emoji' => '🃏'],
            'celtic-cross' => ['name' => 'Кельтский крест', 'emoji' => '✝️'],
            'tarot-love' => ['name' => 'На любовь', 'emoji' => '💕'],
            'tarot-future' => ['name' => 'На будущее', 'emoji' => '🔮'],
            'tarot-birthdate' => ['name' => 'По дате рождения', 'emoji' => '⭐'],
            'coffee-grounds' => ['name' => 'На кофейной гуще', 'emoji' => '☕'],
            'runes' => ['name' => 'На рунах', 'emoji' => 'ᚱ'],
        ];

    

        $result = $rows->map(function ($r) use ($types) {
            $t = $types[$r->type] ?? ['name' => $r->type, 'emoji' => '🔮'];
            return [
                'uuid' => $r->uuid,
                'type' => $r->type,
                'type_name' => $t['name'],
                'emoji' => $t['emoji'],
                'question' => $r->question,
                'preview' => preg_replace('/\*\*/', '', $r->prediction),
                'date' => optional($r->created_at)->format('d.m.Y H:i'),
            ];
        });

        return response()->json(['items' => $result, 'total' => $result->count()]);
    }

    public function share(string $uuid) {
        $row = DivinationResult::where('uuid', $uuid)->first();
        if (!$row) return response()->json(['error' => 'not found'], 404);
        return response()->json([
            'uuid' => $row->uuid,
            'type' => $row->type,
            'question' => $row->question,
            'prediction' => $row->prediction,
            'created_at' => optional($row->created_at)->format('d.m.Y H:i'),
        ]);
    }


    /**
     * Опциональная аутентификация — возвращает user_id если токен валидный, null если его нет.
     * Нужно чтобы гадания работали и для анонимов, и для авторизованных.
     */
    private function resolveUserId(Request $request): ?int
    {
        if ($user = $request->user()) {
            return $user->id;
        }
        $authHeader = $request->header('Authorization');
        if (!$authHeader) return null;
        if (!preg_match('/Bearer\s+(.+)$/i', $authHeader, $m)) return null;
        $token = PersonalAccessToken::findToken($m[1]);
        return $token?->tokenable_id;
    }

    private function buildPrompt(string $type, string $question, array $extra): string
    {
        // Человекочитаемая дата (ISO -> русская), чтобы LLM не путала цифры
        $birthHuman = '';
        $bd = (string) ($extra['birthdate'] ?? '');
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $bd, $m)) {
            $months = [1=>'января',2=>'февраля',3=>'марта',4=>'апреля',5=>'мая',6=>'июня',
                       7=>'июля',8=>'августа',9=>'сентября',10=>'октября',11=>'ноября',12=>'декабря'];
            $mi = (int) $m[2];
            $birthHuman = (int)$m[3].' '.($months[$mi] ?? $m[2]).' '.$m[1].' года ('.(int)$m[3].'.'.$m[2].'.'.$m[1].')';
        }

        $prompts = [
            'tarot-yes-no' => "ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА: последней строкой, отдельно от всего текста, выведи служебную строку CARDS: <slug карт через запятую>. Используй только slug из списка ниже. Ты — мудрый таролог. Вытяни одну карту из Старших Арканов Таро и дай чёткий ответ ДА или НЕТ на вопрос. Опиши карту (название + аркан) и дай краткое мистическое толкование (3-4 предложения). Вопрос: «{$question}» ВАЖНО: В самом конце ответа, после толкования, добавь ТОЛЬКО одну строку в формате: CARDS: slug где slug — один из: sut, mag, verxovnaia-zrica, imperatrica, imperator, ierofant, vliublennye, kolesnica, sila, otselnik, koleso-fortuny, spravedlivost, povesennyi, smert, umerennost, diavol, basnia, zvezda, luna, solnce, sud, mir",

            'celtic-cross' => "ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА: последней строкой, отдельно от всего текста, выведи служебную строку CARDS: <slug карт через запятую>. Используй только slug из списка ниже. Ты — опытный таролог. Сделай полный расклад Кельтский крест на 10 карт: 1) Суть ситуации, 2) Что помогает/мешает, 3) Основа/корень, 4) Прошлое, 5) Возможное будущее, 6) Ближайшее будущее, 7) Ваше отношение, 8) Окружение, 9) Надежды/страхи, 10) Итог. Для каждой карты — название аркана и толкование в контексте вопроса (1-2 предложения). В конце — общий вывод. Вопрос: «{$question}» ВАЖНО: В самом конце ответа, после общего вывода, добавь ТОЛЬКО одну строку в формате: CARDS: slug1, slug2, slug3, slug4, slug5, slug6, slug7, slug8, slug9, slug10 где каждый slug — один из: sut, mag, verxovnaia-zrica, imperatrica, imperator, ierofant, vliublennye, kolesnica, sila, otselnik, koleso-fortuny, spravedlivost, povesennyi, smert, umerennost, diavol, basnia, zvezda, luna, solnce, sud, mir (по порядку позиций расклада 1-10)",

            'tarot-love' => "ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА: последней строкой, отдельно от всего текста, выведи служебную строку CARDS: <slug карт через запятую>. Используй только slug из списка ниже. Ты — таролог-эксперт в вопросах любви. Сделай расклад на 3 карты: Прошлое любви, Настоящее, Будущее. Для каждой карты — название + толкование в контексте отношений (2 предложения). В конце — совет. Вопрос querent: «{$question}» ВАЖНО: В самом конце ответа, после совета, добавь ТОЛЬКО одну строку в формате: CARDS: slug1, slug2, slug3 где каждый slug — один из: sut, mag, verxovnaia-zrica, imperatrica, imperator, ierofant, vliublennye, kolesnica, sila, otselnik, koleso-fortuny, spravedlivost, povesennyi, smert, umerennost, diavol, basnia, zvezda, luna, solnce, sud, mir (по порядку: Прошлое, Настоящее, Будущее)",

            'tarot-future' => "ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА: последней строкой, отдельно от всего текста, выведи служебную строку CARDS: <slug карт через запятую>. Используй только slug из списка ниже. Ты — таролог-провидец. Сделай расклад на 5 карт: Ближайшая неделя, Месяц, 3 месяца, Полгода, Год. Для каждой карты — название + прогноз (2 предложения). В конце — ключевой совет на будущее. Вопрос/ситуация: «{$question}» ВАЖНО: В самом конце ответа, после совета, добавь ТОЛЬКО одну строку в формате: CARDS: slug1, slug2, slug3, slug4, slug5 где каждый slug — один из: sut, mag, verxovnaia-zrica, imperatrica, imperator, ierofant, vliublennye, kolesnica, sila, otselnik, koleso-fortuny, spravedlivost, povesennyi, smert, umerennost, diavol, basnia, zvezda, luna, solnce, sud, mir (по порядку: неделя, месяц, 3 мес, полгода, год)",

            'tarot-birthdate' => "ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА: последней строкой, отдельно от всего текста, выведи служебную строку CARDS: <slug карт через запятую>. Используй только slug из списка ниже. Ты — таролог-нумеролог. Дата рождения клиента: {$birthHuman}. Используй ТОЛЬКО эту дату и не меняй в ней ни одну цифру. Определи число судьбы (сумма всех цифр даты, свёрнутая до однозначного числа) и выбери персональную карту Старших Арканов. Дай толкование: характер, предназначение, главный урок жизни, прогноз на ближайшее будущее (всего 4-5 предложений). ВАЖНО: В самом конце ответа добавь ТОЛЬКО одну строку в формате: CARDS: slug где slug — один из: sut, mag, verxovnaia-zrica, imperatrica, imperator, ierofant, vliublennye, kolesnica, sila, otselnik, koleso-fortuny, spravedlivost, povesennyi, smert, umerennost, diavol, basnia, zvezda, luna, solnce, sud, mir",
            
            'coffee-grounds' => "Ты — мастер чтения по кофейной гуще. Опиши символические узоры, которые видишь на дне чашки (геометрические фигуры, образы животных, предметов), и интерпретируй их как предсказание. Укажи 3-4 ключевых символа и что они означают для querent. Вопрос: «{$question}»",
            
            'runes' => "Ты — мудрый рунолог. Вытяни 3 руны из Старшего Футарка (можно назвать: Феху, Уруз, Турисаз, Ансуз, Райдо, Кеназ, Гебо, Вуньо, Хагалаз, Наудиз, Иса, Йера, Эйваз, Перт, Альгиз, Совило, Тейваз, Беркана, Эваз, Манназ, Лагуз, Ингуз, Дагаз, Отала). Для каждой руны: название + значение в контексте вопроса + совет. В конце — итоговый рунический расклад. Вопрос: «{$question}»",
        ];

        return $prompts[$type] ?? "Дай мистическое предсказание. Вопрос: «{$question}»";
    }

    private function getFallback(string $type): string
    {
        $fallbacks = [
            'tarot-yes-no' => "🃏 **Дурак (The Fool, 0 аркан)**\n\nКарта нового начала. Вселенная говорит: «Доверься потоку». Ответ ближе к ДА — но путь будет неожиданным. Отпусти страх и сделай первый шаг.",
            
            'celtic-cross' => "✝️ **Кельтский крест:**\n1. Суть: Маг (I) — у вас есть все ресурсы\n2. Препятствие: Восьмёрка Мечей — самоограничения\n3. Корень: Четвёрка Пентаклей — страх потери\n4. Прошлое: Десятка Кубков — был период гармонии\n5. Возможное: Звезда (XVII) — надежда\n6. Ближайшее: Туз Жезлов — искра действия\n7. Ваше отношение: Двойка Мечей — нерешительность\n8. Окружение: Паж Кубков — поддержка\n9. Страхи: Башня (XVI) — страх перемен\n10. Итог: Мир (XXI) — завершение цикла\n\n**Совет:** У вас есть всё для победы — действуйте!",
            
            'tarot-love' => "💕 **Расклад на любовь:**\n- **Прошлое:** Влюблённые (VI) — важный выбор, развилка\n- **Настоящее:** Справедливость (XI) — баланс и честность\n- **Будущее:** Кубки Два (2 Кубков) — встреча, взаимность\n\n**Совет:** Будьте открыты и честны — настоящая любовь близко.",
            
            'tarot-future' => "🔮 **Расклад на будущее:**\n- **Неделя:** Туз Жезлов — искра новой идеи\n- **Месяц:** Императрица — изобилие, творчество\n- **3 месяца:** Колесо Фортуны — удача поворачивается\n- **Полгода:** Сила — внутренняя победа\n- **Год:** Мир — завершение большого цикла\n\n**Совет:** Доверяйте процессу — всё идёт по плану Вселенной.",
            
            'tarot-birthdate' => "⭐ **Персональная карта:**\nВаша карта Старших Арканов отражает путь души. Число судьбы указывает на предназначение: нести свет и вдохновение окружающим. Главный урок — научиться доверять интуиции. В ближайшее время вас ждут благоприятные перемены в сфере самореализации.",
            
            'coffee-grounds' => "☕ **Кофейная гуща показывает:**\n- **Круг** — завершение цикла, всё придёт в равновесие\n- **Птица** — важные новости в ближайшие дни\n- **Дорога** — путь к цели открыт\n\n**Итог:** Вселенная поддерживает ваши планы — двигайтесь вперёд спокойно.",
            
            'runes' => "ᚱ **Рунический расклад:**\n- **Феху (ᚠ)** — изобилие и новые возможности\n- **Ансуз (ᚨ)** — мудрость и божественная поддержка\n- **Совило (ᛊ)** — победа и ясность\n\n**Совет рун:** Время действовать — космические силы на вашей стороне.",
        ];

        return $fallbacks[$type] ?? "Вселенная хранит молчание... Задайте вопрос ещё раз.";
    }

    /**
     * Парсит ответ LLM, извлекает slug'и карт и удаляет техническую строку
     */
    private function extractCards(string $response, string $type): array
    {
        $expected = [
            'tarot-yes-no' => 1,
            'tarot-love' => 3,
            'tarot-future' => 5,
            'tarot-birthdate' => 1,
            'celtic-cross' => 10,
        ][$type] ?? 0;

        if ($type === 'runes') {
            $cards = $this->extractRuneCards($response);
            return ['prediction' => trim($response), 'cards' => $cards];
        }

        if ($expected === 0) {
            return ['prediction' => $response, 'cards' => []];
        }

        $cards = [];
        $lineMatch = preg_match('/CARDS\s*:\s*([^\n]+)/i', $response, $m);
        if ($lineMatch) {
            $line = mb_strtolower($m[1]);
            preg_match_all('/[a-z][a-z\-]*/', $line, $tok);
            $valid = \App\Models\TarotCard::whereIn('slug', array_unique($tok[0]))->get()->keyBy('slug');
            foreach ($tok[0] as $slug) {
                if (isset($valid[$slug])) {
                    $cards[] = [
                        'slug' => $valid[$slug]->slug,
                        'name' => $valid[$slug]->name,
                        'image' => $valid[$slug]->image,
                    ];
                }
                if (count($cards) >= $expected) break;
            }
            $response = preg_replace('/\n?[^\n]*CARDS\s*:\s*[^\n]*/i', '', $response);
        }

        // Fallback: LLM не вывел строку CARDS — ищем названия карт в тексте
        if (count($cards) === 0) {
            $all = \App\Models\TarotCard::orderBy('id')->get();
            $found = [];
            foreach ($all as $card) {
                if (preg_match('/\b' . preg_quote($card->name, '/') . '\b/ui', $response, $mm, PREG_OFFSET_CAPTURE)) {
                    $found[] = ['pos' => $mm[0][1], 'card' => $card];
                }
            }
            usort($found, fn($a, $b) => $a['pos'] <=> $b['pos']);
            foreach ($found as $f) {
                $cards[] = [
                    'slug' => $f['card']->slug,
                    'name' => $f['card']->name,
                    'image' => $f['card']->image,
                ];
                if (count($cards) >= $expected) break;
            }
        }

        return ['prediction' => trim($response), 'cards' => $cards];
    }


    /**
     * Извлекает руны из ответа AI и добавляет картинки
     */
    private function extractRuneCards(string $response): array
    {
        $cards = [];
        $lower = mb_strtolower($response);

        foreach (self::RUNES_MAP as $name => $slug) {
            if (mb_strpos($lower, mb_strtolower($name)) === false) continue;
            // Проверяем что эта руна ещё не добавлена (могли быть дубли в маппинге)
            $alreadyExists = false;
            foreach ($cards as $c) {
                if ($c['slug'] === $slug) { $alreadyExists = true; break; }
            }
            if ($alreadyExists) continue;

            $imgs = \App\Support\Runes::images($slug);
            if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($imgs['image'])) continue;

            // Определяем русское имя руны
            $ruName = $this->runeRuName($slug);

            $cards[] = [
                'name' => $ruName,
                'slug' => $slug,
                'image' => $imgs['med'] ?? $imgs['image'],
                'glyph' => $this->runeGlyph($slug),
            ];
        }

        // Ограничиваем 3 рунами (стандартный расклад), сохраняя порядок упоминания в тексте
        return array_slice($cards, 0, 3);
    }

    private function runeRuName(string $slug): string
    {
        return [
            'fehu' => 'Феху', 'uruz' => 'Уруз', 'thurisaz' => 'Турисаз',
            'ansuz' => 'Ансуз', 'raidho' => 'Райдо', 'kenaz' => 'Кеназ',
            'gebo' => 'Гебо', 'wunjo' => 'Вуньо', 'hagalaz' => 'Хагалаз',
            'naudiz' => 'Наудиз', 'isa' => 'Иса', 'jera' => 'Йера',
            'eihwaz' => 'Эйваз', 'perthro' => 'Перт', 'algiz' => 'Альгиз',
            'sowilo' => 'Совило', 'tiwaz' => 'Тейваз', 'berkano' => 'Беркана',
            'ehwaz' => 'Эваз', 'mannaz' => 'Манназ', 'laguz' => 'Лагуз',
            'ingwaz' => 'Ингуз', 'dagaz' => 'Дагаз', 'othala' => 'Отала',
        ][$slug] ?? $slug;
    }

    private function runeGlyph(string $slug): string
    {
        return [
            'fehu' => 'ᚠ', 'uruz' => 'ᚢ', 'thurisaz' => 'ᚦ',
            'ansuz' => 'ᚨ', 'raidho' => 'ᚱ', 'kenaz' => 'ᚲ',
            'gebo' => 'ᚷ', 'wunjo' => 'ᚹ', 'hagalaz' => 'ᚺ',
            'naudiz' => 'ᚾ', 'isa' => 'ᛁ', 'jera' => 'ᛃ',
            'eihwaz' => 'ᛇ', 'perthro' => 'ᛈ', 'algiz' => 'ᛉ',
            'sowilo' => 'ᛊ', 'tiwaz' => 'ᛏ', 'berkano' => 'ᛒ',
            'ehwaz' => 'ᛖ', 'mannaz' => 'ᛗ', 'laguz' => 'ᛚ',
            'ingwaz' => 'ᛜ', 'dagaz' => 'ᛞ', 'othala' => 'ᛟ',
        ][$slug] ?? 'ᚱ';
    }
}
