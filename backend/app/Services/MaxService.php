<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MaxService
{
    private string $token;
    private string $baseUrl = 'https://platform-api2.max.ru';

    public function __construct()
    {
        $this->token = env('MAX_BOT_TOKEN', '');
    }

    /**
     * Отправить текстовое сообщение
     */
    public function sendMessage(int|string $userId, string $text, array $options = []): ?array
    {
        $payload = [
            'text' => mb_substr($text, 0, 4000),
        ];

        if (!empty($options['format'])) {
            $payload['format'] = $options['format'];
        }

        if (!empty($options['attachments'])) {
            $payload['attachments'] = $options['attachments'];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post("{$this->baseUrl}/messages?user_id={$userId}", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Max sendMessage failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Max sendMessage exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Отправить сообщение с inline-кнопками
     */
    public function sendMessageWithButtons(int|string $userId, string $text, array $buttons): ?array
    {
        // buttons format: [[['text' => '...', 'url' => '...'], ...], ...]
        $formattedButtons = [];
        foreach ($buttons as $row) {
            $rowButtons = [];
            foreach ($row as $btn) {
                if (isset($btn['url'])) {
                    $rowButtons[] = [
                        'type' => 'link',
                        'text' => $btn['text'],
                        'url' => $btn['url'],
                    ];
                } elseif (isset($btn['callback'])) {
                    $rowButtons[] = [
                        'type' => 'callback',
                        'text' => $btn['text'],
                        'payload' => $btn['callback'],
                    ];
                }
            }
            if (!empty($rowButtons)) {
                $formattedButtons[] = $rowButtons;
            }
        }

        return $this->sendMessage($userId, $text, [
            'attachments' => [
                [
                    'type' => 'inline_keyboard',
                    'payload' => [
                        'buttons' => $formattedButtons,
                    ],
                ],
            ],
        ]);
    }


    /**
     * Отправить меню (кнопки-команды) отдельным сообщением
     */
    public function sendMenu(int|string $userId): ?array
    {
        return $this->sendMessageWithButtons($userId, "📋 Меню:", [
            [['text' => '🔮 Гороскоп на сегодня', 'callback' => 'cmd:today']],
            [['text' => '📋 Мои гороскопы', 'callback' => 'cmd:my']],
            [['text' => '⚙️ Настройки', 'callback' => 'cmd:settings']],
            [['text' => '❓ Справка', 'callback' => 'cmd:help']],
        ]);
    }

    /**
     * Получить информацию о боте
     */
    public function getMe(): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->withoutVerifying()->get("{$this->baseUrl}/me");

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('Max getMe exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Установить webhook
     */
    public function setWebhook(string $url, string $secret = ''): bool
    {
        try {
            $payload = [
                'url' => $url,
                'update_types' => ['message_created', 'bot_started', 'message_callback'],
            ];
            if ($secret) {
                $payload['secret'] = $secret;
            }

            $response = Http::withHeaders([
                'Authorization' => $this->token,
                'Content-Type' => 'application/json',
            ])->withoutVerifying()->post("{$this->baseUrl}/subscriptions", $payload);

            Log::info('Max setWebhook response', ['status' => $response->status(), 'body' => $response->body()]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Max setWebhook exception: ' . $e->getMessage());
            return false;
        }
    }
}
