<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AffirmationController;
use App\Http\Controllers\Api\AffirmationRssController;
use App\Http\Controllers\Api\NatalChartController;
use App\Http\Controllers\Api\PopupNotificationController;
use App\Http\Controllers\Api\RetrogradeController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\MagicLinkController;
use App\Http\Controllers\Api\UnsubscribeController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\HoroscopeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DailyHoroscopeController;
use App\Http\Controllers\Api\SubscribeController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\Admin\PlanController as AdminPlanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentWebhookController;
use Illuminate\Support\Facades\Route;
use App\Models\BlogPost;

// ===== Public routes =====
Route::post('/register', [AuthController::class, 'register']);
Route::get('/affirmations/today', [AffirmationController::class, 'today']);
Route::get('/affirmations/{date}', [AffirmationController::class, 'show'])->where('date', '\d{4}-\d{2}-\d{2}');
Route::get('/affirmations/rss', [AffirmationRssController::class, 'feed']);
// Натальная карта
Route::post('/natal-chart/order', [NatalChartController::class, 'order']);
Route::post('/natal-chart/payment-webhook', [NatalChartController::class, 'paymentWebhook']);

Route::get('/affirmations/calendar', [AffirmationController::class, 'calendar']);
Route::post('/login', [AuthController::class, 'login']);

// Публичная подписка на ежедневный гороскоп (без регистрации)
Route::post('/subscribe-daily', [SubscribeController::class, 'subscribe']);

// Email verification
Route::get('/verify-email', [EmailVerificationController::class, 'verifyGet']);
Route::post('/verify-email', [EmailVerificationController::class, 'verify']);
Route::post('/resend-verification', [EmailVerificationController::class, 'resend']);

// Magic link (вход без пароля)
Route::post('/magic-link', [MagicLinkController::class, 'request']);
Route::post('/magic-link/verify', [MagicLinkController::class, 'verify']);

// Webhook оплаты от Т-Банка (публичный)
Route::post('/payments/webhook', [PaymentWebhookController::class, 'handle']);

// RSS-фиды (скрытые, для агрегаторов и личного использования)
Route::get('/feeds', [FeedController::class, 'index']);
Route::get('/feeds/blog', [FeedController::class, 'blog']);
Route::get('/feeds/{slug}', [FeedController::class, 'sign']);

// Тарифы (публично)
Route::post('/telegram/webhook', [\App\Http\Controllers\Api\TelegramWebhookController::class, 'handle']);

// ===== Бесплатные гороскопы (публичные) =====
Route::get('/free-horoscopes/systems', function () {
    $service = app(\App\Services\FreeHoroscopeService::class);
    $out = [];
    foreach ($service->systems() as $slug => $s) {
        $out[] = [
            'slug' => $slug,
            'name' => $s['name'],
            'emoji' => $s['emoji'],
            'by' => $s['by'],
            'description' => $s['description'],
            'signs' => collect($s['signs'])->map(fn($v, $k) => ['slug' => $k, 'name' => $v[0], 'emoji' => $v[1]])->values(),
        ];
    }
    return response()->json(['systems' => $out]);
});

Route::get('/free-horoscopes/{system}/my-sign', function (string $system, \Illuminate\Http\Request $request) {
    $service = app(\App\Services\FreeHoroscopeService::class);
    $year = (int) $request->query('year', 0);
    $month = (int) $request->query('month', 0);
    $day = (int) $request->query('day', 0);
    $by = config("horoscope_systems.{$system}.by");
    $sign = $by === 'year' || $by === 'year9'
        ? $service->signByYear($system, $year)
        : $service->signByDate($system, $month, $day);
    $meta = config("horoscope_systems.{$system}.signs.{$sign}");
    return response()->json(['sign' => $sign, 'name' => $meta[0] ?? null, 'emoji' => $meta[1] ?? null]);
});

Route::get('/free-horoscopes/{system}/{sign}', function (string $system, string $sign) {
    $service = app(\App\Services\FreeHoroscopeService::class);
    $sys = $service->system($system);
    if (!$sys || !isset($sys['signs'][$sign])) {
        return response()->json(['error' => 'not found'], 404);
    }
    $today = $service->get($system, $sign);
    $tomorrow = $service->get($system, $sign, now()->addDay());
    $meta = $sys['signs'][$sign];
    return response()->json([
        'system' => ['slug' => $system, 'name' => $sys['name'], 'emoji' => $sys['emoji']],
        'sign' => ['slug' => $sign, 'name' => $meta[0], 'emoji' => $meta[1]],
        'today' => $today?->content,
        'tomorrow' => $tomorrow?->content,
        'date' => now()->locale('ru')->isoFormat('D MMMM YYYY'),
    ]);
});

Route::get('/compatibility/{sign1}/{sign2}', function (string $sign1, string $sign2) {
    [$a, $b] = [$sign1, $sign2];
    if ($a > $b) [$a, $b] = [$b, $a];
    $row = \App\Models\CompatibilityCache::where('sign1', $a)->where('sign2', $b)->first();
    $meta1 = config("horoscope_signs.{$a}");
    $meta2 = config("horoscope_signs.{$b}");
    return response()->json([
        'sign1' => $a, 'sign2' => $b,
        'content' => $row?->content,
    ]);
});

Route::get('/horoscope/personal/{id}', function (int $id) {
    $h = \App\Models\Horoscope::find($id);
    if (!$h) return response()->json(['error' => 'not found'], 404);
    return response()->json([
        'horoscope' => $h,
        'date' => $h->created_at->locale('ru')->isoFormat('D MMMM YYYY'),
    ]);
})->middleware('auth:sanctum');

Route::get('/counters', function () {
    return response()->json([
        'counters' => \App\Models\Counter::where('is_active', true)->get(['id', 'name', 'type', 'code', 'raw_code']),
    ]);
});

Route::get('/plans', [PlanController::class, 'index']);

// Отписка в один клик (ссылка из писем)
Route::get('/unsubscribe/{userId}/{signature}', [UnsubscribeController::class, 'unsubscribe']);

// Общие гороскопы — доступны БЕЗ регистрации
Route::get('/daily-horoscopes', [DailyHoroscopeController::class, 'index']);
Route::get('/daily-horoscopes/{slug}', [DailyHoroscopeController::class, 'show']);

// ===== Protected routes =====
Route::get('/retrograde', [RetrogradeController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/affirmations/subscribe', [\App\Http\Controllers\Api\AffirmationController::class, 'subscribe']);
    Route::delete('/affirmations/subscribe', [\App\Http\Controllers\Api\AffirmationController::class, 'unsubscribe']);
        // Натальная карта
        Route::get('/natal-chart/my', [NatalChartController::class, 'my']);
        Route::get('/natal-chart/order/{orderId}/status', [NatalChartController::class, 'orderStatus']);
        Route::post('/natal-chart/toggle-weekly', [NatalChartController::class, 'toggleWeeklyHoroscope']);
        Route::get('/natal-chart/{chartId}/svg', [NatalChartController::class, 'chartSvg']);
        Route::get('/popups', [PopupNotificationController::class, 'index']);
        Route::get('/popups/welcome', [PopupNotificationController::class, 'welcome']);
        Route::post('/popups/welcome/dismiss', [PopupNotificationController::class, 'dismissWelcome']);
        Route::post('/popups/{id}/dismiss', [PopupNotificationController::class, 'dismiss']);

    Route::get('/affirmations/subscription-status', [\App\Http\Controllers\Api\AffirmationController::class, 'subscriptionStatus']);
    Route::get('/referrals', [\App\Http\Controllers\Api\ReferralController::class, 'index']);
    Route::get('/subscription/settings', [\App\Http\Controllers\Api\SubscriptionController::class, 'getSettings']);
    Route::post('/subscription/channels', [\App\Http\Controllers\Api\SubscriptionController::class, 'updateChannels']);
    Route::post('/subscription/calendars', [\App\Http\Controllers\Api\SubscriptionController::class, 'updateCalendars']);
    Route::post('/subscription/types', [\App\Http\Controllers\Api\SubscriptionController::class, 'updateTypes']);
    Route::get('/subscription/digest-prefs', [\App\Http\Controllers\Api\SubscriptionController::class, 'getDigestPrefs']);
    Route::post('/subscription/digest-prefs', [\App\Http\Controllers\Api\SubscriptionController::class, 'updateDigestPrefs']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/set-password', [AuthController::class, 'setPassword']);
    Route::get('/telegram/confirm/{chatId}', function (string $chatId, \Illuminate\Http\Request $request) {
    $userId = $request->user()->id;

    $sub = \App\Models\TelegramSubscriber::where('chat_id', $chatId)->first();
    $firstLink = !$sub || !$sub->user_id;

    if ($sub) {
        $sub->update(['user_id' => $userId, 'is_active' => true]);
    } else {
        \App\Models\TelegramSubscriber::create([
            'chat_id' => $chatId,
            'user_id' => $userId,
            'is_active' => true,
        ]);
    }

    // Сообщение — только при ПЕРВОЙ привязке (защита от дублей)
    if ($firstLink) {
        app(\App\Services\TelegramService::class)->sendMessage(
            $chatId,
            "✅ <b>Telegram подключён!</b>\n\nТеперь я буду присылать ваш гороскоп каждое утро в 8:00.\n\n<b>Команды:</b>\n/today — гороскоп на сегодня\n/settings — настройки\n/unsubscribe — отписаться"
        );
    }

    return response()->json(['ok' => true]);
})->middleware('auth:sanctum');

Route::post('/subscription/auto-renew', function (\Illuminate\Http\Request $request) {
    $sub = \App\Models\Subscription::where('user_id', $request->user()->id)
        ->orderByDesc('id')->first();
    if (!$sub) return response()->json(['success' => false, 'message' => 'Нет подписки'], 404);

    $enabled = $request->boolean('enabled');
    if ($enabled && !$sub->rebill_id) {
        return response()->json(['success' => false, 'message' => 'Нет привязанной карты — оплатите подписку с галочкой «Автопродление»'], 400);
    }

    $sub->update(['auto_renew' => $enabled]);
    return response()->json(['success' => true, 'auto_renew' => $enabled]);
})->middleware('auth:sanctum');

Route::get('/telegram/link', function (\Illuminate\Http\Request $request) {
    $userId = $request->user()->id;
    $sig = hash_hmac('sha256', (string) $userId, config('app.key'));
    $username = env('TELEGRAM_BOT_USERNAME', 'neiro_horoskop_bot');
    return response()->json([
        'url' => "https://t.me/{$username}?start={$userId}-{$sig}",
        'connected' => (bool) \App\Models\TelegramSubscriber::where('user_id', $userId)->where('is_active', true)->exists(),
    ]);
});

Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/horoscope/generate', [HoroscopeController::class, 'generate']);
    Route::get('/horoscopes', [HoroscopeController::class, 'index']);

    // Платежи
    Route::post('/payments/init', [PaymentController::class, 'init']);
    Route::get('/payments/history', [PaymentController::class, 'history']);
    Route::get('/payments/last', [PaymentController::class, 'last']);
    Route::get('/payments/{payment}/status', [PaymentController::class, 'status']);
});

// ===== Admin routes =====
Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureIsAdmin::class])->prefix('admin')->group(function () {
    Route::post('/telegram/webhook', [\App\Http\Controllers\Api\TelegramWebhookController::class, 'handle']);

// ===== Бесплатные гороскопы (публичные) =====
Route::get('/free-horoscopes/systems', function () {
    $service = app(\App\Services\FreeHoroscopeService::class);
    $out = [];
    foreach ($service->systems() as $slug => $s) {
        $out[] = [
            'slug' => $slug,
            'name' => $s['name'],
            'emoji' => $s['emoji'],
            'by' => $s['by'],
            'description' => $s['description'],
            'signs' => collect($s['signs'])->map(fn($v, $k) => ['slug' => $k, 'name' => $v[0], 'emoji' => $v[1]])->values(),
        ];
    }
    return response()->json(['systems' => $out]);
});

Route::get('/free-horoscopes/{system}/my-sign', function (string $system, \Illuminate\Http\Request $request) {
    $service = app(\App\Services\FreeHoroscopeService::class);
    $year = (int) $request->query('year', 0);
    $month = (int) $request->query('month', 0);
    $day = (int) $request->query('day', 0);
    $by = config("horoscope_systems.{$system}.by");
    $sign = $by === 'year' || $by === 'year9'
        ? $service->signByYear($system, $year)
        : $service->signByDate($system, $month, $day);
    $meta = config("horoscope_systems.{$system}.signs.{$sign}");
    return response()->json(['sign' => $sign, 'name' => $meta[0] ?? null, 'emoji' => $meta[1] ?? null]);
});

Route::get('/free-horoscopes/{system}/{sign}', function (string $system, string $sign) {
    $service = app(\App\Services\FreeHoroscopeService::class);
    $sys = $service->system($system);
    if (!$sys || !isset($sys['signs'][$sign])) {
        return response()->json(['error' => 'not found'], 404);
    }
    $today = $service->get($system, $sign);
    $tomorrow = $service->get($system, $sign, now()->addDay());
    $meta = $sys['signs'][$sign];
    return response()->json([
        'system' => ['slug' => $system, 'name' => $sys['name'], 'emoji' => $sys['emoji']],
        'sign' => ['slug' => $sign, 'name' => $meta[0], 'emoji' => $meta[1]],
        'today' => $today?->content,
        'tomorrow' => $tomorrow?->content,
        'date' => now()->locale('ru')->isoFormat('D MMMM YYYY'),
    ]);
});

Route::get('/compatibility/{sign1}/{sign2}', function (string $sign1, string $sign2) {
    [$a, $b] = [$sign1, $sign2];
    if ($a > $b) [$a, $b] = [$b, $a];
    $row = \App\Models\CompatibilityCache::where('sign1', $a)->where('sign2', $b)->first();
    $meta1 = config("horoscope_signs.{$a}");
    $meta2 = config("horoscope_signs.{$b}");
    return response()->json([
        'sign1' => $a, 'sign2' => $b,
        'content' => $row?->content,
    ]);
});

Route::get('/horoscope/personal/{id}', function (int $id) {
    $h = \App\Models\Horoscope::find($id);
    if (!$h) return response()->json(['error' => 'not found'], 404);
    return response()->json([
        'horoscope' => $h,
        'date' => $h->created_at->locale('ru')->isoFormat('D MMMM YYYY'),
    ]);
})->middleware('auth:sanctum');

Route::get('/counters', function () {
    return response()->json([
        'counters' => \App\Models\Counter::where('is_active', true)->get(['id', 'name', 'type', 'code', 'raw_code']),
    ]);
});

Route::get('/plans', [AdminPlanController::class, 'index']);
    Route::post('/plans', [AdminPlanController::class, 'store']);
    Route::put('/plans/{plan}', [AdminPlanController::class, 'update']);
    Route::delete('/plans/{plan}', [AdminPlanController::class, 'destroy']);
});


Route::get('/blog', function () {
    $posts = BlogPost::published()
        ->orderByDesc('published_at')
        ->take(3)
        ->get()
        ->map(fn ($p) => [
            'slug' => $p->slug,
            'title' => $p->title,
            'excerpt' => $p->excerpt,
            'cover_image' => $p->cover_image ? asset('storage/' . $p->cover_image) : null,
            'published_at' => $p->published_at?->format('d.m.Y'),
            'url' => route('blog.show', $p),
        ]);
    return response()->json(['posts' => $posts]);
});


// ===== Карта Таро дня =====
Route::get('/tarot/today', function () {
    $day = now()->format('Ymd');
    $count = \App\Models\TarotCard::count();
    $index = crc32($day) % $count;
    $card = \App\Models\TarotCard::orderBy('id')->skip($index)->first();
    return response()->json([
        'date' => now()->format('d.m.Y'),
        'card' => $card,
    ]);
});

// ===== Биоритмы =====
Route::get('/biorhythms', function (\Illuminate\Http\Request $request) {
    $birth = $request->query('birth_date');
    if (!$birth || !strtotime($birth)) {
        return response()->json(['error' => 'Укажите birth_date в формате YYYY-MM-DD'], 422);
    }
    $days = (int) floor((time() - strtotime($birth)) / 86400);
    $calc = fn ($period) => round(sin(2 * M_PI * $days / $period) * 100);
    $phys = $calc(23);
    $emot = $calc(28);
    $intel = $calc(33);
    $avg = (int) round(($phys + $emot + $intel) / 3);
    return response()->json([
        'date' => now()->format('d.m.Y'),
        'days' => $days,
        'physical' => $phys,
        'emotional' => $emot,
        'intellectual' => $intel,
        'average' => $avg,
    ]);
});


Route::post('/biorhythms/advice', function (\Illuminate\Http\Request $request) {
    $p = (int) $request->input('physical', 0);
    $e = (int) $request->input('emotional', 0);
    $i = (int) $request->input('intellectual', 0);
    $avg = (int) round(($p + $e + $i) / 3);
    $text = app(\App\Services\AiService::class)->generateBiorhythmAdvice($p, $e, $i, $avg);
    return response()->json(['advice' => $text ?: 'Сегодня прислушайтесь к своему телу и делайте то, что приносит радость. Берегите себя!']);
});


// ===== Сонник =====
Route::get('/dreams', function (\Illuminate\Http\Request $request) {
    if ($request->query('all')) {
        return response()->json(['symbols' => \App\Models\DreamSymbol::where('approved', true)->orderBy('keyword')->get(['keyword'])]);
    }
    $q = mb_strtolower(trim($request->query('q', '')));
    if (mb_strlen($q) < 2) {
        return response()->json(['symbols' => \App\Models\DreamSymbol::where('approved', true)->inRandomOrder()->limit(24)->get(['keyword'])]);
    }
    $symbols = \App\Models\DreamSymbol::where('approved', true)->where('keyword', 'like', "%{$q}%")
        ->limit(20)->get();
    return response()->json(['symbols' => $symbols, 'query' => $q]);
});

Route::post('/dreams/ai', function (\Illuminate\Http\Request $request) {
    $q = mb_strtolower(trim($request->input('query', '')));
    if (!$q || mb_strlen($q) < 2 || mb_strlen($q) > 40) {
        return response()->json(['error' => 'Введите одно слово или короткую фразу'], 422);
    }
    if (!preg_match('/^[а-яёa-z0-9\s-]+$/iu', $q)) {
        return response()->json(['error' => 'Только буквы, без спецсимволов'], 422);
    }
    $bad = ['хуй','хуе','хуё','пизд','ебат','ебан','ебал','ебль','ёбан','ёбат','бляд','блят','мудак','муда','гандон','пидор','пидр','шлюх','дроч','говн','сран','сучк','сучар','сука','huy','pizd','ebat','ebal','blyat','suka','gandon','pidor','shluh','droch','govn','fuck','shit','bitch'];
    foreach ($bad as $b) {
        if (mb_stripos($q, $b) !== false) {
            return response()->json(['error' => 'Такие слова мы не толкуем 🙈'], 422);
        }
    }
    $existing = \App\Models\DreamSymbol::where('keyword', $q)->first();
    if ($existing) {
        $existing->increment('views');
        return response()->json(['keyword' => $existing->keyword, 'interpretation' => $existing->interpretation]);
    }
    $text = app(\App\Services\AiService::class)->generateDreamInterpretation($q);
    if ($text) {
        $sym = \App\Models\DreamSymbol::create(['keyword' => $q, 'interpretation' => $text, 'ai_generated' => true, 'approved' => false]);
        return response()->json(['keyword' => $sym->keyword, 'interpretation' => $sym->interpretation, 'ai' => true]);
    }
    return response()->json(['error' => 'Не удалось растолковать сон. Попробуйте позже.'], 500);
});

Route::get('/dreams/count', fn () => response()->json(['count' => \App\Models\DreamSymbol::count()]));

// MAX Messenger Webhook
Route::get('/ads', [\App\Http\Controllers\Api\AdController::class, 'index']);
Route::post('/divination/{type}', [\App\Http\Controllers\Api\DivinationController::class, 'predict']);
Route::get('/divination/history', [\App\Http\Controllers\Api\DivinationController::class, 'history'])->middleware('auth:sanctum');
Route::get('/share/{uuid}', [\App\Http\Controllers\Api\DivinationController::class, 'share']);
    Route::post('/crystal-ball/predict', [\App\Http\Controllers\Api\CrystalBallController::class, 'predict']);
    Route::post('/max/webhook', [\App\Http\Controllers\Api\MaxWebhookController::class, 'handle']);

// MAX Connect (authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/referrals', [\App\Http\Controllers\Api\ReferralController::class, 'index']);
    Route::get('/max/link', [\App\Http\Controllers\Api\MaxConnectController::class, 'link']);
    Route::post('/max/confirm/{maxUserId}', [\App\Http\Controllers\Api\MaxConnectController::class, 'confirm']);
});
Route::get('/max/setup-webhook', [\App\Http\Controllers\Api\MaxWebhookController::class, 'setupWebhook']);

// === ЗНАЧЕНИЯ ИМЕН ===
Route::get('/names', function (\Illuminate\Http\Request $request) {
    $q = mb_strtolower(trim($request->input('q', '')));
    
    if (mb_strlen($q) < 2) {
        // Возвращаем 50 случайных имён
        $names = \App\Models\NameMeaning::where('approved', true)
            ->inRandomOrder()
            ->limit(50)
            ->get(['name', 'translit', 'origin']);
        return response()->json(['names' => $names]);
    }
    
    // Поиск
    $names = \App\Models\NameMeaning::where('approved', true)
        ->where(function ($query) use ($q) {
            $query->where('name', 'ILIKE', "%{$q}%")
                  ->orWhere('translit', 'ILIKE', "%{$q}%");
        })
        ->limit(20)
        ->get(['name', 'translit', 'origin', 'interpretation']);
    
    return response()->json(['names' => $names]);
});

Route::get('/names/count', fn () => response()->json(['count' => \App\Models\NameMeaning::where('approved', true)->count()]));



Route::post('/names/ai', function (\Illuminate\Http\Request $request) {
    $request->validate([
        'name' => 'required|string|max:50|min:2',
    ]);
    
    $rawName = trim(mb_strtolower($request->name));
    $name = mb_strtoupper(mb_substr($rawName, 0, 1)) . mb_substr($rawName, 1);
    $translit = transliterateName($name);
    
    // Проверяем есть ли уже
    $existing = \App\Models\NameMeaning::where('translit', $translit)->first();
    if ($existing) {
        return response()->json(['name' => $existing, 'cached' => true]);
    }
    
    // Генерируем AI
    $interpretation = app(\App\Services\AiService::class)->generateNameMeaning($name);
    if (!$interpretation) {
        return response()->json(['error' => 'ai_failed'], 500);
    }
    
    $meaning = \App\Models\NameMeaning::create([
        'name' => $name,
        'translit' => $translit,
        'interpretation' => $interpretation,
        'ai_generated' => true,
        'approved' => true,
    ]);
    
    return response()->json(['name' => $meaning, 'cached' => false]);
});

// Хелперы транслитерации
function transliterateName(string $text): string {
    $map = [
        'а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ё'=>'yo','ж'=>'zh','з'=>'z','и'=>'i',
        'й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n','о'=>'o','п'=>'p','р'=>'r','с'=>'s','т'=>'t',
        'у'=>'u','ф'=>'f','х'=>'kh','ц'=>'ts','ч'=>'ch','ш'=>'sh','щ'=>'sch','ъ'=>'','ы'=>'y','ь'=>'',
        'э'=>'e','ю'=>'yu','я'=>'ya'
    ];
    return mb_strtolower(str_replace(array_keys($map), array_values($map), $text));
}

function detransliterateName(string $text): string {
    $map = [
        'yo'=>'ё','zh'=>'ж','kh'=>'х','ts'=>'ц','ch'=>'ч','sh'=>'ш','sch'=>'щ','yu'=>'ю','ya'=>'я',
        'a'=>'а','b'=>'б','v'=>'в','g'=>'г','d'=>'д','e'=>'е','z'=>'з','i'=>'и','y'=>'й',
        'k'=>'к','l'=>'л','m'=>'м','n'=>'н','o'=>'о','p'=>'п','r'=>'р','s'=>'с','t'=>'т',
        'u'=>'у','f'=>'ф'
    ];
    $text = mb_strtolower($text);
    foreach ($map as $lat => $cyr) {
        $text = str_replace($lat, $cyr, $text);
    }
    return $text;
}

Route::get('/names/origins', function () {
    $origins = \App\Models\NameMeaning::where('approved', true)
        ->whereNotNull('origin')
        ->select('origin')
        ->distinct()
        ->pluck('origin')
        ->sort()
        ->values();
    return response()->json(['origins' => $origins]);
});

// === ЗНАЧЕНИЯ ИМЕН ===
Route::get('/names/origins', function () {
    $origins = \App\Models\NameMeaning::where('approved', true)
        ->whereNotNull('origin')
        ->select('origin')
        ->distinct()
        ->pluck('origin')
        ->sort()
        ->values();
    return response()->json(['origins' => $origins]);
});

Route::get('/names/count', fn () => response()->json(['count' => \App\Models\NameMeaning::where('approved', true)->count()]));

Route::get('/names', function (\Illuminate\Http\Request $request) {
    $q = mb_strtolower(trim($request->input('q', '')));
    $origin = trim($request->input('origin', ''));

    $query = \App\Models\NameMeaning::where('approved', true);

    if ($origin) {
        $query->where('origin', $origin);
    }

    if (mb_strlen($q) < 2) {
        $names = $query->inRandomOrder()->limit(100)->get(['name', 'translit', 'origin']);
        return response()->json(['names' => $names]);
    }

    $names = $query
        ->where(function ($query) use ($q) {
            $query->where('name', 'ILIKE', "%{$q}%")
                  ->orWhere('translit', 'ILIKE', "%{$q}%");
        })
        ->limit(20)
        ->get(['name', 'translit', 'origin', 'interpretation']);

    return response()->json(['names' => $names]);
});

Route::get('/names/{translit}', function (string $translit) {
    $name = \App\Models\NameMeaning::where('translit', $translit)
        ->where('approved', true)
        ->first();

    if (!$name) {
        $detranslit = detransliterateName($translit);
        $name = \App\Models\NameMeaning::where('name', $detranslit)
            ->where('approved', true)
            ->first();
    }

    if (!$name) {
        return response()->json(['error' => 'not_found'], 404);
    }

    $name->increment('views');

    // Похожие по происхождению
    $byOrigin = [];
    if ($name->origin) {
        $byOrigin = \App\Models\NameMeaning::where('approved', true)
            ->where('origin', $name->origin)
            ->where('id', '!=', $name->id)
            ->inRandomOrder()
            ->limit(10)
            ->get(['name', 'translit', 'origin']);
    }

    // Имена на ту же букву
    $firstLetter = mb_substr($name->name, 0, 1);
    $byLetter = \App\Models\NameMeaning::where('approved', true)
        ->where('name', 'LIKE', $firstLetter . '%')
        ->where('id', '!=', $name->id)
        ->inRandomOrder()
        ->limit(10)
        ->get(['name', 'translit', 'origin']);

    return response()->json([
        'name' => $name,
        'related' => [
            'by_origin' => $byOrigin,
            'by_letter' => $byLetter,
        ],
    ]);
});

Route::post('/names/ai', function (\Illuminate\Http\Request $request) {
    $request->validate([
        'name' => 'required|string|max:50|min:2',
    ]);

    $rawName = trim(mb_strtolower($request->name));
    $name = mb_strtoupper(mb_substr($rawName, 0, 1)) . mb_substr($rawName, 1);
    $translit = transliterateName($name);

    $existing = \App\Models\NameMeaning::where('translit', $translit)->first();
    if ($existing) {
        return response()->json(['name' => $existing, 'cached' => true]);
    }

    $interpretation = app(\App\Services\AiService::class)->generateNameMeaning($name);
    if (!$interpretation) {
        return response()->json(['error' => 'ai_failed'], 500);
    }

    $origin = app(\App\Services\AiService::class)->detectNameOrigin($name);

    $meaning = \App\Models\NameMeaning::create([
        'name' => $name,
        'translit' => $translit,
        'interpretation' => $interpretation,
        'origin' => $origin,
        'ai_generated' => true,
        'approved' => true,
    ]);

    return response()->json(['name' => $meaning, 'cached' => false]);
});

// Совместимость имён
Route::post('/names/compatibility', function (\Illuminate\Http\Request $request) {
    $request->validate([
        'name1' => 'required|string|max:50|min:2',
        'name2' => 'required|string|max:50|min:2',
    ]);

    $name1 = trim(mb_strtolower($request->name1));
    $name2 = trim(mb_strtolower($request->name2));
    $name1 = mb_strtoupper(mb_substr($name1, 0, 1)) . mb_substr($name1, 1);
    $name2 = mb_strtoupper(mb_substr($name2, 0, 1)) . mb_substr($name2, 1);

    // Кэш: проверяем есть ли уже анализ
    $cacheKey = 'name_compat_' . md5($name1 . '|' . $name2);
    $cached = cache($cacheKey);
    if ($cached) {
        return response()->json($cached);
    }

    // Генерируем AI
    $analysis = app(\App\Services\AiService::class)->analyzeNameCompatibility($name1, $name2);
    if (!$analysis) {
        return response()->json(['error' => 'ai_failed'], 500);
    }

    $result = [
        'name1' => $name1,
        'name2' => $name2,
        'analysis' => $analysis,
    ];

    cache([$cacheKey => $result], now()->addDay());

    return response()->json($result);
});

// Нижнее меню (футер)
Route::get('/footer-menu', function () {
    $cacheKey = 'footer_menu';
    $menu = cache($cacheKey);
    
    if (!$menu) {
        $menu = \App\Models\FooterMenuItem::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['title', 'url', 'open_in_new_tab']);
        cache([$cacheKey => $menu], now()->addHour());
    }
    
    return response()->json(['menu' => $menu]);
});
