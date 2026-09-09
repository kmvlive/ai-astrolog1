<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaxSubscriber;
use App\Models\User;
use App\Services\MaxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MaxWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // Проверка секрета
        $secret = env('MAX_WEBHOOK_SECRET', '');
        if ($secret && $request->header('X-Max-Bot-Api-Secret') !== $secret) {
            Log::warning('Max webhook: invalid secret');
            return response('Forbidden', 403);
        }

        $data = $request->json()->all();
        $updateType = $data['update_type'] ?? '';

        Log::info('Max webhook received', ['type' => $updateType]);

        switch ($updateType) {
            case 'bot_started':
                $this->handleBotStarted($data);
                break;
            case 'message_created':
                $this->handleMessage($data);
                break;
            case 'message_callback':
                $this->handleCallback($data);
                break;
            case 'bot_stopped':
                $this->handleBotStopped($data);
                break;
        }

        return response('OK', 200);
    }

    private function handleBotStarted(array $data): void
    {
        $userId = $data['user']['user_id'] ?? null;
        if (!$userId) return;

        $sub = MaxSubscriber::updateOrCreate(
            ['user_id' => $userId],
            [
                'first_name' => $data['user']['first_name'] ?? null,
                'last_name' => $data['user']['last_name'] ?? null,
                'username' => $data['user']['username'] ?? null,
                'is_active' => true,
                'last_activity_at' => now(),
            ]
        );

        $max = app(MaxService::class);
        $max->sendMessageWithButtons($userId, 
            "👋 Привет! Я AI Астролог — ваш персональный астрологический помощник.\n\n" .
            "Я составляю гороскопы на основе вашей натальной карты с помощью ИИ.\n\n" .
            "Попробуйте команды:\n" .
            "/help — справка\n" .
            "/my — мои гороскопы\n" .
            "/settings — настройки\n" .
            "/today — гороскоп на сегодня",
            [
                [['text' => '📋 Мои гороскопы', 'callback' => 'cmd:my']],
                [['text' => '⚙️ Настройки', 'callback' => 'cmd:settings']],
            ]
        );
    }

    private function handleMessage(array $data): void
    {
        $userId = $data['user']['user_id'] ?? null;
        $text = trim($data['body']['text'] ?? '');
        if (!$userId || !$text) return;

        // Обновляем активность
        MaxSubscriber::updateOrCreate(
            ['user_id' => $userId],
            [
                'first_name' => $data['user']['first_name'] ?? null,
                'last_name' => $data['user']['last_name'] ?? null,
                'is_active' => true,
                'last_activity_at' => now(),
            ]
        );

        $max = app(MaxService::class);

        if (str_starts_with($text, '/')) {
            $command = strtolower(explode(' ', $text)[0]);
            $this->handleCommand($max, $userId, $command);
        } else {
            $max->sendMessage($userId, "Используйте команды:\n/help — справка\n/my — мои гороскопы\n/settings — настройки\n/today — гороскоп на сегодня");
        }
    }

    private function handleCallback(array $data): void
    {
        $userId = $data['user']['user_id'] ?? null;
        $payload = $data['payload'] ?? '';
        if (!$userId) return;

        $max = app(MaxService::class);

        if (str_starts_with($payload, 'cmd:')) {
            $command = substr($payload, 4);
            $this->handleCommand($max, $userId, '/' . $command);
        }
    }

    private function handleCommand(MaxService $max, int|string $userId, string $command): void
    {
        $sub = MaxSubscriber::where('user_id', $userId)->first();

        switch ($command) {
            case '/start':
            case '/help':
                $max->sendMessageWithButtons($userId,
                    "🔮 *AI Астролог — команды*\n\n" .
                    "/today — гороскоп на сегодня\n" .
                    "/my — мои персональные гороскопы\n" .
                    "/settings — настройки рассылки\n" .
                    "/help — эта справка",
                    [
                        [['text' => '🔮 Гороскоп на сегодня', 'callback' => 'cmd:today']],
                        [['text' => '📋 Мои гороскопы', 'callback' => 'cmd:my']],
                        [['text' => '⚙️ Настройки', 'callback' => 'cmd:settings']],
                    ]
                );
                break;

            case '/my':
                $horoscopes = \App\Models\Horoscope::where('user_id', $sub?->user_id_fk)
                    ->orderByDesc('date')
                    ->limit(5)
                    ->get();

                if ($horoscopes->isEmpty()) {
                    $max->sendMessage($userId, "У вас пока нет гороскопов.\nЗарегистрируйтесь на сайте my.neiro-astro.ru и введите данные рождения.");
                } else {
                    $buttons = [];
                    foreach ($horoscopes as $h) {
                        $buttons[] = [[
                            'text' => "🔮 {$h->date} — {$h->type}",
                            'url' => "https://my.neiro-astro.ru/horoscopes/{$h->id}",
                        ]];
                    }
                    $max->sendMessageWithButtons($userId, "📋 Ваши последние гороскопы:", $buttons);
                }
                break;

            case '/settings':
                $types = $sub?->horoscope_types ?? ['general'];
                $typeNames = [
                    'general' => '🔮 Общий',
                    'love' => '💕 Любовь',
                    'career' => '💼 Карьера',
                    'health' => '🏥 Здоровье',
                ];
                $activeTypes = array_map(fn($t) => $typeNames[$t] ?? $t, $types);

                $max->sendMessageWithButtons($userId,
                    "⚙️ *Ваши настройки:*\n\n" .
                    "Типы гороскопов в рассылке:\n" . implode("\n", array_map(fn($t) => "✓ {$t}", $activeTypes)) . "\n\n" .
                    "📨 MAX: ✅ включено",
                    [
                        [['text' => '🌐 Настроить на сайте', 'url' => 'https://my.neiro-astro.ru/dashboard']],
                    ]
                );
                break;

            case '/today':
                $today = \App\Models\Horoscope::where('user_id', $sub?->user_id_fk)
                    ->where('date', now()->toDateString())
                    ->first();

                if ($today) {
                    $preview = mb_substr(strip_tags($today->content), 0, 500) . '...';
                    $max->sendMessageWithButtons($userId,
                        "🔮 *Гороскоп на сегодня*\n\n{$preview}",
                        [
                            [['text' => '📖 Читать полностью', 'url' => "https://my.neiro-astro.ru/horoscopes/{$today->id}"]],
                        ]
                    );
                } else {
                    $max->sendMessage($userId, "Гороскоп на сегодня ещё не готов. Загляните позже! 🌟");
                }
                break;

            default:
                $max->sendMessage($userId, "Неизвестная команда. Используйте /help для справки.");
        }
    }

    private function handleBotStopped(array $data): void
    {
        $userId = $data['user']['user_id'] ?? null;
        if ($userId) {
            MaxSubscriber::where('user_id', $userId)->update(['is_active' => false]);
        }
    }

    /**
     * Установить webhook
     */
    public function setupWebhook()
    {
        $max = app(MaxService::class);
        $url = 'https://my.neiro-astro.ru/api/max/webhook';
        $secret = env('MAX_WEBHOOK_SECRET', '');

        $result = $max->setWebhook($url, $secret);

        return response()->json([
            'success' => $result,
            'url' => $url,
        ]);
    }
}
