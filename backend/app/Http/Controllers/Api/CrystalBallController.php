<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CrystalBallController extends Controller
{
    public function predict(Request $request)
    {
        $question = $request->input('question', '');

        // Кэш на 1 минуту — чтобы не спамить AI
        $cacheKey = 'crystal_ball_' . md5($question . now()->format('Y-m-d-H-i'));

        return Cache::remember($cacheKey, 60, function () use ($question) {
            $ai = app(AiService::class);

            $prompt = "Ты — магический хрустальный шар, древний оракул. " .
                "Дай короткое мистическое предсказание (2-4 предложения) на русском языке. " .
                "Будь загадочным, поэтичным, используй образы звёзд, луны, судьбы. " .
                "Не будь банальным — каждое предсказание уникально. " .
                ($question ? "Вопрос querent: «{$question}»" : "Дай общее предсказание на сегодня.");

            try {
                $response = $ai->chat($prompt, [
                    'temperature' => 0.9,
                    'max_tokens' => 200,
                ]);

                if (!$response) throw new \Exception('AI returned null');

                return response()->json([
                    'prediction' => $response,
                    'timestamp' => now()->toISOString(),
                ]);
            } catch (\Exception $e) {
                // Fallback — случайное предсказание
                $fallbacks = [
                    "Звёзды шепчут о переменах... То, что казалось невозможным, скоро станет реальностью. Доверьтесь потоку Вселенной.",
                    "Луна освещает ваш путь. Скоро вы получите знак — будьте внимательны к совпадениям вокруг вас.",
                    "Космическая энергия благоволит вам. Загаданное желание начинает обретать форму в тонком мире.",
                    "Планеты выстраиваются в вашу пользу. Терпение — ваш главный союзник сейчас. Награда близка.",
                    "Хрустальный шар видит свет в конце тоннеля. Ваши усилия скоро принесут плоды, о которых вы мечтали.",
                    "Судьба готовит вам сюрприз. Откройте сердце новому — и Вселенная ответит взаимностью.",
                    "Звёздная пыль оседает на ваших ладонях. Это знак — время действовать. Момент настал.",
                    "Древние силы говорят: отпустите старое, чтобы новое вошло в вашу жизнь. Перемены уже у порога.",
                ];

                return response()->json([
                    'prediction' => $fallbacks[array_rand($fallbacks)],
                    'timestamp' => now()->toISOString(),
                    'fallback' => true,
                ]);
            }
        });
    }
}
