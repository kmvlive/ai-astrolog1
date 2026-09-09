<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TelegramSubscriber;
use App\Services\TelegramService;
use App\Helpers\SubscriptionHelper;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    public function handle(Request $request, TelegramService $telegram)
    {
        $secret = $request->header('X-Telegram-Bot-Api-Secret-Token');
        if ($secret !== env('TELEGRAM_WEBHOOK_SECRET')) {
            return response('Unauthorized', 403);
        }

        $update = $request->all();
        $message = $update['message'] ?? null;

        if (!$message || !isset($message['text'])) {
            return response('OK');
        }

        $chatId = (string) $message['chat']['id'];
        $text = $message['text'];
        $username = $message['from']['username'] ?? null;
        $firstName = $message['from']['first_name'] ?? 'друг';

        if (str_starts_with($text, '/start')) {
            $payload = trim(substr($text, 6));
            $this->handleStart($chatId, $username, $firstName, $telegram, $payload ?: null);
        } elseif ($text === '/today') {
            $this->handleToday($chatId, $telegram);
        } elseif ($text === '/renew') {
            $this->handleRenew($chatId, $telegram);
        } elseif ($text === '/settings') {
            $this->handleSettings($chatId, $telegram);
        } elseif ($text === '/unsubscribe') {
            $this->handleUnsubscribe($chatId, $telegram);
        } elseif ($text === '/help') {
            $this->handleHelp($chatId, $telegram);
        } elseif ($text === '/my') {
            $this->handleMy($chatId, $telegram);
        }

        return response('OK');
    }

    private function handleStart(string $chatId, ?string $username, string $firstName, TelegramService $telegram, ?string $payload = null)
    {
        // Сохраняем chat_id как pending (без user_id) — подтвердим на сайте
        TelegramSubscriber::updateOrCreate(
            ['chat_id' => $chatId],
            [
                'username' => $username,
                'first_name' => $firstName,
                'is_active' => false,
            ]
        );

        if ($payload && str_contains($payload, '-')) {
            // Есть payload — сразу привязываем
            [$userId, $sig] = explode('-', $payload, 2);
            $expected = hash_hmac('sha256', $userId, config('app.key'));

            if (hash_equals($expected, $sig)) {
                $sub = TelegramSubscriber::updateOrCreate(
                    ['chat_id' => $chatId],
                    [
                        'user_id' => (int) $userId,
                        'username' => $username,
                        'first_name' => $firstName,
                        'is_active' => true,
                    ]
                );

                // Автодобавляем канал Telegram пользователю
                $user = \App\Models\User::find((int) $userId);
                if ($user) {
                    $tgChannel = \App\Models\Channel::where('slug', 'telegram')->first();
                    if ($tgChannel && !$user->channels()->where('channels.id', $tgChannel->id)->exists()) {
                        $user->channels()->attach($tgChannel->id, [
                            'channel_identifier' => null,
                            'is_verified' => true,
                        ]);
                    }
                }

                $user = \App\Models\User::find($userId);
                $button = $user ? SubscriptionHelper::ctaButton($user) : null;
                $options = [];
                if ($button) {
                    $options['reply_markup'] = json_encode([
                        'inline_keyboard' => [[['text' => $button[0], 'url' => $button[1]]]],
                    ]);
                }
                $telegram->sendMessage($chatId,
                    "✅ <b>Telegram подключён!</b>\n\n" .
                    "Теперь я буду присылать ваш гороскоп каждое утро в 8:00.\n\n" .
                    "<b>Команды:</b>\n" .
                    "/today — гороскоп на сегодня\n" .
                    "/settings — настройки рассылки\n" .
                    "/unsubscribe — отписаться",
                    $options
                );
                return;
            }
        }

        // Нет payload (или Telegram не передал) — предлагаем кнопку подтверждения
        $confirmUrl = "https://my.neiro-astro.ru/api/telegram/confirm/pending-{$chatId}";

        $telegram->sendMessage($chatId,
            "👋 Привет, {$firstName}!\n\n" .
            "Я бот <b>AI Астролога</b> — присылаю персональные гороскопы каждое утро.\n\n" .
            "Чтобы подключить доставку:\n" .
            "1. Зайдите на сайт: https://my.neiro-astro.ru/dashboard\n" .
            "2. Нажмите «Подключить Telegram»\n" .
            "3. Вернитесь сюда — появится кнопка подтверждения",
            [
                'reply_markup' => json_encode([
                    'inline_keyboard' => [[
                        [
                            'text' => '✅ Подключить к моему аккаунту',
                            'url' => "https://my.neiro-astro.ru/connect-telegram?chat={$chatId}",
                        ],
                    ]],
                ]),
            ]
        );
    }

    private function handleToday(string $chatId, TelegramService $telegram)
    {
        $sub = TelegramSubscriber::where('chat_id', $chatId)->where('is_active', true)->first();

        if (!$sub || !$sub->user_id) {
            $telegram->sendMessage($chatId, "❌ Вы не подключены. Нажмите «Подключить Telegram» в кабинете: https://my.neiro-astro.ru/dashboard");
            return;
        }

        $profile = $sub->user?->profile;
        if (!$profile || !$profile->zodiac_sign) {
            $telegram->sendMessage($chatId, "❌ Заполните профиль на сайте: https://my.neiro-astro.ru/profile");
            return;
        }

        $signsMeta = [
            'Ari' => ['Овен', '♈'], 'Tau' => ['Телец', '♉'], 'Gem' => ['Близнецы', '♊'],
            'Can' => ['Рак', '♋'], 'Leo' => ['Лев', '♌'], 'Vir' => ['Дева', '♍'],
            'Lib' => ['Весы', '♎'], 'Sco' => ['Скорпион', '♏'], 'Sag' => ['Стрелец', '♐'],
            'Cap' => ['Козерог', '♑'], 'Aqu' => ['Водолей', '♒'], 'Pis' => ['Рыбы', '♓'],
        ];

        [$signName, $signEmoji] = $signsMeta[$profile->zodiac_sign] ?? ['Рак', '♋'];
        $date = now()->startOfDay();
        $dateRu = $date->locale('ru')->isoFormat('D MMMM YYYY');

        $horoscope = \App\Models\DailyHoroscope::where('date', $date)
            ->where('zodiac_sign', $profile->zodiac_sign)
            ->where('type', 'general')
            ->where('period', 'today')
            ->first();

        if (!$horoscope) {
            $content = app(\App\Services\AiService::class)
                ->generateDailyHoroscope($profile->zodiac_sign, $signName, $date, 'general', 'today');
            if (!$content) {
                $telegram->sendMessage($chatId, "😔 Не удалось сгенерировать гороскоп, попробуйте позже.");
                return;
            }
            $horoscope = \App\Models\DailyHoroscope::create([
                'date' => $date,
                'zodiac_sign' => $profile->zodiac_sign,
                'type' => 'general',
                'period' => 'today',
                'content' => $content,
            ]);
        }

        $truncated = app(\App\Services\UniSenderService::class)->truncateHalf($horoscope->content);
        $signSlug = array_search([$signName, $signEmoji], $signsMeta) ?: 'rak';

        $button = SubscriptionHelper::ctaButton($sub->user);
        $telegram->sendHoroscope($chatId, $signEmoji, $signName, $dateRu, [
            [
                'emoji' => '🔮',
                'name' => 'Общий',
                'truncated' => $truncated,
                'url' => "https://my.neiro-astro.ru/horoscopes/{$signSlug}",
            ],
        ], $button);
    }

    private function handleSettings(string $chatId, TelegramService $telegram)
    {
        $sub = TelegramSubscriber::where('chat_id', $chatId)->first();

        if (!$sub || !$sub->user_id) {
            $telegram->sendMessage($chatId, "❌ Вы не подключены. Нажмите «Подключить Telegram» в кабинете: https://my.neiro-astro.ru/dashboard");
            return;
        }

        $typeNames = [
            'general' => '🔮 Общий', 'love' => '❤️ Любовь', 'career' => '💼 Карьера',
            'financial' => '💰 Финансы', 'finance' => '💰 Финансы', 'health' => '🌿 Здоровье',
        ];

        $types = $sub->horoscope_types ?? ['general'];
        $text = "⚙️ <b>Ваши настройки:</b>\n\nТипы гороскопов в рассылке:\n";
        foreach ($types as $t) {
            $text .= "✓ " . ($typeNames[$t] ?? $t) . "\n";
        }
        $text .= "\n📧 Email: " . ($sub->user->channels()->where('slug', 'email')->exists() ? '✅ включено' : '❌ выключено') . "\n";
        $text .= "🤖 Telegram: ✅ включено\n";

        $keyboard = [
            [['text' => '⚙️ Изменить настройки', 'url' => 'https://my.neiro-astro.ru/dashboard']],
        ];

        $button = SubscriptionHelper::ctaButton($sub->user);
        if ($button) {
            $keyboard[] = [['text' => $button[0], 'url' => $button[1]]];
        }

        $telegram->sendMessage($chatId, $text, [
            'reply_markup' => json_encode(['inline_keyboard' => $keyboard]),
        ]);
    }

    private function handleUnsubscribe(string $chatId, TelegramService $telegram)
    {
        $sub = TelegramSubscriber::where('chat_id', $chatId)->first();

        if ($sub) {
            $sub->update(['is_active' => false]);
        }

        $telegram->sendMessage($chatId, "❌ Вы отписались от рассылки.\n\nЧтобы подписаться снова — нажмите «Подключить Telegram» в кабинете.");
    }

    private function handleMy(string $chatId, TelegramService $telegram)
    {
        $sub = TelegramSubscriber::where('chat_id', $chatId)->where('is_active', true)->first();

        if (!$sub || !$sub->user_id) {
            $telegram->sendMessage($chatId, "❌ Вы не подключены. Нажмите «Подключить Telegram» в кабинете: https://my.neiro-astro.ru/dashboard");
            return;
        }

        $horoscopes = \App\Models\Horoscope::where('user_id', $sub->user_id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        if ($horoscopes->isEmpty()) {
            $telegram->sendMessage($chatId, "📭 У вас пока нет персональных гороскопов.\n\nЗаполните профиль на сайте, чтобы получить первый прогноз: https://my.neiro-astro.ru/profile");
            return;
        }

        $typeNames = [
            'general' => '🔮 Персональный',
            'love' => '❤️ Любовь',
            'career' => '💼 Карьера',
            'financial' => '💰 Финансы',
            'health' => '🌿 Здоровье',
        ];

        $text = "📋 <b>Ваши последние гороскопы:</b>\n\n";
        $buttons = [];

        foreach ($horoscopes as $h) {
            $date = $h->created_at->locale('ru')->isoFormat('D MMMM');
            $typeName = $typeNames[$h->type] ?? '✨ Гороскоп';
            $text .= "{$date} — {$typeName}\n";
            $buttons[] = ['text' => $date, 'url' => "https://my.neiro-astro.ru/my-horoscopes/{$h->id}"];
        }

        $text .= "\nНажмите на дату, чтобы прочитать полностью 👇";

        // Кнопки по 2 в ряд
        $keyboard = array_chunk($buttons, 2);
        $keyboard[] = [['text' => '📋 Все гороскопы', 'url' => 'https://my.neiro-astro.ru/my-horoscopes']];

        $telegram->sendMessage($chatId, $text, [
            'reply_markup' => json_encode(['inline_keyboard' => $keyboard]),
        ]);
    }

    private function handleHelp(string $chatId, TelegramService $telegram)
    {
        $sub = TelegramSubscriber::where('chat_id', $chatId)->where('is_active', true)->first();
        $button = $sub && $sub->user ? SubscriptionHelper::ctaButton($sub->user) : null;
        $options = [];
        if ($button) {
            $options['reply_markup'] = json_encode([
                'inline_keyboard' => [[['text' => $button[0], 'url' => $button[1]]]],
            ]);
        }
        $telegram->sendMessage($chatId,
            "🤖 <b>Справка по боту</b>\n\n" .
            "<b>Команды:</b>\n" .
            "/start — подключить Telegram\n" .
            "/today — гороскоп на сегодня\n" .
            "/my — мои гороскопы\n" .
            "/settings — настройки рассылки\n" .
            "/unsubscribe — отписаться\n" .
            "/help — эта справка\n\n" .
            "Сайт: https://my.neiro-astro.ru",
            $options
        );
    }
}
