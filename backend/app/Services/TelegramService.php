<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private string $baseUrl;

    public function __construct()
    {
        $token = env('TELEGRAM_BOT_TOKEN');
        $this->baseUrl = "https://api.telegram.org/bot{$token}";
    }

    public function sendMessage(string $chatId, string $text, array $options = []): bool
    {
        try {
            $response = Http::timeout(30)->retry(3, 2000)->post("{$this->baseUrl}/sendMessage", array_merge([
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
            ], $options));

            if ($response->successful()) {
                return true;
            }

            Log::error('Telegram send error', ['response' => $response->json()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Telegram exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function sendHoroscope(string $chatId, string $signEmoji, string $signName, string $dateRu, array $sections, ?array $button = null): bool
    {
        $text = "🔮 <b>Ваш гороскоп на {$dateRu}</b>\n{$signEmoji} <b>{$signName}</b>\n\n";
        
        foreach ($sections as $s) {
            $text .= "{$s['emoji']} <b>{$s['name']}</b>\n{$s['truncated']}\n\n";
            $text .= "📖 <a href=\"{$s['url']}\">Читать полностью →</a>\n\n";
        }

        $text .= "\n💎 <i>Хотите прогноз, составленный лично для вас?</i>\n";
        $text .= "<a href=\"https://my.neiro-astro.ru/dashboard\">Заказать индивидуальный гороскоп →</a>";

        $options = ['disable_web_page_preview' => true];
        if ($button) {
            $options['reply_markup'] = json_encode([
                'inline_keyboard' => [[
                    ['text' => $button[0], 'url' => $button[1]],
                ]],
            ]);
        }

        return $this->sendMessage($chatId, $text, $options);
    }

    /** Устанавливает меню команд бота (кнопка Menu) */
    public function setMenu(): bool
    {
        try {
            $response = Http::timeout(30)->connectTimeout(10)->post("{$this->baseUrl}/setMyCommands", [
                'commands' => [
                    ['command' => 'today', 'description' => '🔮 Гороскоп на сегодня'],
                    ['command' => 'renew', 'description' => '💳 Подписка: продлить или оформить'],
                    ['command' => 'settings', 'description' => '⚙️ Настройки рассылки'],
                    ['command' => 'help', 'description' => '🤖 Справка'],
                    ['command' => 'unsubscribe', 'description' => '❌ Отписаться'],
                ],
            ]);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Telegram setMenu exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function setWebhook(string $url): bool
    {
        try {
            $response = Http::timeout(30)->connectTimeout(10)->post("{$this->baseUrl}/setWebhook", [
                'url' => $url,
                'secret_token' => env('TELEGRAM_WEBHOOK_SECRET'),
            ]);

            if ($response->successful() && $response->json('ok')) {
                Log::info('Telegram webhook set', ['url' => $url]);
                return true;
            }

            Log::error('Telegram webhook error', ['response' => $response->json()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Telegram webhook exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function deleteWebhook(): bool
    {
        try {
            $response = Http::timeout(30)->connectTimeout(10)->post("{$this->baseUrl}/deleteWebhook");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Отправляет свежую статью блога в Telegram с картинкой
     */
    public function sendBlogPost(string $chatId, \App\Models\BlogPost $post): bool
    {
        $caption = "📝 <b>Сегодня в блоге</b>\n\n"
            . "<b>{$post->title}</b>\n\n"
            . htmlspecialchars($post->excerpt ?: mb_substr(strip_tags($post->content), 0, 280), ENT_XML1) . "…\n\n"
            . '<a href="' . route('blog.show', $post) . '">Читать полностью →</a>';

        if ($post->cover_image && file_exists(storage_path('app/public/' . $post->cover_image))) {
            return $this->sendPhoto(
                $chatId,
                asset('storage/' . $post->cover_image),
                $caption,
                ['disable_web_page_preview' => false]
            );
        }

        return $this->sendMessage($chatId, $caption, ['disable_web_page_preview' => false]);
    }


    /**
     * Отправляет фото с подписью
     */
    public function sendPhoto(string $chatId, string $photoUrl, string $caption, array $options = []): bool
    {
        try {
            $response = Http::timeout(60)->retry(3, 2000)->post("{$this->baseUrl}/sendPhoto", array_merge([
                'chat_id' => $chatId,
                'photo' => $photoUrl,
                'caption' => $caption,
                'parse_mode' => 'HTML',
            ], $options));

            if ($response->successful()) {
                return true;
            }

            Log::error('Telegram sendPhoto error', ['response' => $response->json()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Telegram sendPhoto exception', ['error' => $e->getMessage()]);
            return false;
        }
    }


    public function sendCalendar(string $chatId, string $dateRu, array $calendars): bool
    {
        $text = "📅 <b>Ваши календари на {$dateRu}</b>\n\n";

        foreach ($calendars as $cal) {
            $text .= "{$cal['emoji']} <b>{$cal['name']}</b>\n";
            foreach ($cal['blocks'] as $block) {
                $text .= "<i>{$block['h']}</i>\n{$block['t']}\n\n";
            }
        }

        $text .= "\n<a href=\"https://my.neiro-astro.ru/dashboard\">Настроить календари →</a>";

        return $this->sendMessage($chatId, $text, ['disable_web_page_preview' => true]);
    }

}
