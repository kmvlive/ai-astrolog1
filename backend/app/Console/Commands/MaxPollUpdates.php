<?php

namespace App\Console\Commands;

use App\Models\MaxSubscriber;
use App\Services\MaxService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MaxPollUpdates extends Command
{
    protected $signature = 'max:poll';
    protected $description = 'Long polling для MAX Bot API';

    public function handle(): int
    {
        $token = env('MAX_BOT_TOKEN');
        if (!$token) {
            $this->error('MAX_BOT_TOKEN не установлен');
            return 1;
        }

        // Lock — только один процесс polling
        $lockFile = storage_path('max-poll.lock');
        $fp = fopen($lockFile, 'c');
        if (!flock($fp, LOCK_EX | LOCK_NB)) {
            $this->error('⚠️ Другой процесс polling уже запущен. Выход.');
            fclose($fp);
            return 0;
        }
        file_put_contents($lockFile, getmypid());

        $this->info('🔄 MAX Long Polling запущен (PID: ' . getmypid() . ')...');

        // Удаляем webhook если есть
        Http::withHeaders(['Authorization' => $token])
            ->withoutVerifying()
            ->delete('https://platform-api2.max.ru/subscriptions?url=' . urlencode('https://my.neiro-astro.ru/api/max/webhook'));

        $marker = 0;

        while (true) {
            try {
                $url = "https://platform-api2.max.ru/updates?limit=10&timeout=25";
                if ($marker > 0) {
                    $url .= "&marker={$marker}";
                }

                $response = Http::withHeaders(['Authorization' => $token])
                    ->withoutVerifying()
                    ->timeout(35)
                    ->get($url);

                if (!$response->successful()) {
                    Log::warning('Max poll HTTP error', ['status' => $response->status()]);
                    sleep(5);
                    continue;
                }

                $data = $response->json();
                $updates = $data['updates'] ?? [];
                
                if (isset($data['marker'])) {
                    $marker = $data['marker'];
                }

                foreach ($updates as $update) {
                    Log::info('Max poll update', ['type' => $update['update_type'] ?? 'unknown']);
                    $this->processUpdate($update);
                }
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                continue;
            } catch (\Exception $e) {
                Log::error('Max poll exception: ' . $e->getMessage());
                sleep(5);
            }
        }

        return 0;
    }

    private function processUpdate(array $data): void
    {
        $updateType = $data['update_type'] ?? '';
        $userId = $data['user']['user_id'] ?? $data['message']['sender']['user_id'] ?? null;

        $max = app(MaxService::class);

        switch ($updateType) {
            case 'bot_started':
                $this->handleBotStarted($max, $data);
                break;
            case 'message_created':
                $this->handleMessage($max, $data);
                break;
            case 'message_callback':
                $this->handleCallback($max, $data);
                break;
            case 'bot_stopped':
                $this->handleBotStopped($data);
                break;
        }
    }

    private function handleBotStarted(MaxService $max, array $data): void
    {
        $userId = $data['user']['user_id'] ?? null;
        if (!$userId) return;

        MaxSubscriber::updateOrCreate(
            ['user_id' => $userId],
            [
                'first_name' => $data['user']['first_name'] ?? null,
                'last_name' => $data['user']['last_name'] ?? null,
                'username' => $data['user']['username'] ?? null,
                'is_active' => true,
                'last_activity_at' => now(),
            ]
        );

        $max->sendMessageWithButtons($userId,
            "👋 Привет! Я AI Астролог — ваш персональный астрологический помощник.\n\n" .
            "Я составляю гороскопы на основе вашей натальной карты с помощью ИИ.\n\n" .
            "Попробуйте команды:\n" .
            "/help — справка\n/my — мои гороскопы\n/settings — настройки\n/today — гороскоп на сегодня",
            [
                [['text' => '📋 Мои гороскопы', 'callback' => 'cmd:my']],
                [['text' => '⚙️ Настройки', 'callback' => 'cmd:settings']],
            ]
        );
    }

    private function handleMessage(MaxService $max, array $data): void
    {
        $userId = $data['message']['sender']['user_id'] ?? $data['user']['user_id'] ?? null;
        $text = trim($data['message']['body']['text'] ?? $data['body']['text'] ?? '');

        Log::info('Max message', ['user_id' => $userId, 'text' => $text]);

        if (!$userId || !$text) return;

        $botId = 407073967;
        if ($userId == $botId) return;

        MaxSubscriber::updateOrCreate(
            ['user_id' => $userId],
            [
                'first_name' => $data['message']['sender']['first_name'] ?? $data['user']['first_name'] ?? null,
                'last_name' => $data['message']['sender']['last_name'] ?? $data['user']['last_name'] ?? null,
                'is_active' => true,
                'last_activity_at' => now(),
            ]
        );

        if (str_starts_with($text, '/')) {
            $command = strtolower(explode(' ', $text)[0]);
            $this->handleCommand($max, $userId, $command);
        } else {
            $max->sendMessage($userId, "Используйте команды:\n/help — справка\n/my — мои гороскопы\n/settings — настройки\n/today — гороскоп на сегодня");
        }
    }

    private function handleCallback(MaxService $max, array $data): void
    {
        $userId = $data['user']['user_id'] ?? $data['message']['sender']['user_id'] ?? null;
        $payload = $data['payload'] ?? $data['callback']['payload'] ?? '';
        if (!$userId) return;

        if (str_starts_with($payload, 'cmd:')) {
            $command = substr($payload, 4);
            $this->handleCommand($max, $userId, '/' . $command);
        }
    }

    private function handleCommand(MaxService $max, int|string $userId, string $command): void
    {
        $sub = MaxSubscriber::where('user_id', $userId)->first();
        Log::info('Max command', ['user_id' => $userId, 'command' => $command]);

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
                    ->orderByDesc('created_at')->limit(5)->get();

                if ($horoscopes->isEmpty()) {
                    $max->sendMessage($userId, "У вас пока нет гороскопов.\nЗарегистрируйтесь на my.neiro-astro.ru");
                } else {
                    $buttons = [];
                    foreach ($horoscopes as $h) {
                        $buttons[] = [['text' => "🔮 " . $h->created_at->format("d.m.Y") . " — " . $h->type, 'url' => "https://my.neiro-astro.ru/my-horoscopes/{$h->id}"]];
                    }
                    $max->sendMessageWithButtons($userId, "📋 Ваши последние гороскопы:", $buttons);
                }
                $max->sendMenu($userId);
                break;

            case '/settings':
                $types = $sub?->horoscope_types ?? ['general'];
                $typeNames = ['general' => '🔮 Общий', 'love' => '💕 Любовь', 'career' => '💼 Карьера', 'health' => '🏥 Здоровье'];
                $activeTypes = array_map(fn($t) => $typeNames[$t] ?? $t, $types);

                $max->sendMessageWithButtons($userId,
                    "⚙️ *Ваши настройки:*\n\nТипы гороскопов:\n" . implode("\n", array_map(fn($t) => "✓ {$t}", $activeTypes)) . "\n\n📨 MAX: ✅ включено",
                    [[['text' => '🌐 Настроить на сайте', 'url' => 'https://my.neiro-astro.ru/dashboard']]]
                );
                $max->sendMenu($userId);
                break;

            case '/today':
                $today = \App\Models\Horoscope::where('user_id', $sub?->user_id_fk)
                    ->whereDate('created_at', now()->toDateString())->first();

                if ($today) {
                    $preview = mb_substr(strip_tags($today->content), 0, 500) . '...';
                    $max->sendMessageWithButtons($userId, "🔮 *Гороскоп на сегодня*\n\n{$preview}",
                        [[['text' => '📖 Читать полностью', 'url' => "https://my.neiro-astro.ru/my-horoscopes/{$today->id}"]]]
                    );
                } else {
                    $max->sendMessage($userId, "Гороскоп на сегодня ещё не готов. Загляните позже! 🌟");
                }
                $max->sendMenu($userId);
                break;

            default:
                $max->sendMessage($userId, "Неизвестная команда. Используйте /help");
                $max->sendMenu($userId);
        }
    }

    private function handleBotStopped(array $data): void
    {
        $userId = $data['user']['user_id'] ?? null;
        if ($userId) {
            MaxSubscriber::where('user_id', $userId)->update(['is_active' => false]);
        }
    }
}
