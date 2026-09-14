<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NatalChart;
use App\Models\NatalChartOrder;
use App\Models\Plan;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\AiService;
use App\Services\TBankService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NatalChartController extends Controller
{
    /**
     * Получить данные текущей натальной карты пользователя
     */
    public function my(Request $request)
    {
        $user = $request->user();
        $chart = NatalChart::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('id')
            ->first();

        if (!$chart) {
            return response()->json(['has_chart' => false]);
        }

        return response()->json([
            'has_chart' => true,
            'chart' => [
                'id' => $chart->id,
                'birth_date' => $chart->birth_date?->format('Y-m-d'),
                'birth_time' => $chart->birth_time,
                'gender' => $chart->gender,
                'city' => $chart->city,
                'status' => $chart->status,
                'generated_at' => $chart->generated_at?->toIso8601String(),
                'svg_url' => '/api/natal-chart/' . $chart->id . '/svg',
                'interpretation' => $chart->interpretation,
            ],
            'weekly_opt_in' => (bool) $user->natal_chart_weekly_opt_in,
        ]);
    }

    /**
     * Инициировать заказ натальной карты
     */
    public function order(Request $request, TBankService $tbank)
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'birth_date' => 'required|date',
            'birth_time' => 'nullable|date_format:H:i',
            'gender' => 'nullable|in:male,female',
            'city' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'plan_slug' => 'required|in:natal-chart-once,natal-chart-weekly',
            'agree_offer' => 'required|accepted',
            'agree_personal_data' => 'required|accepted',
            'weekly_horoscope_opt_in' => 'nullable|boolean',
        ]);

        $plan = Plan::where('slug', $data['plan_slug'])->where('active', true)->first();
        if (!$plan) {
            return response()->json(['success' => false, 'message' => 'Тариф недоступен'], 400);
        }

        // Находим или создаём пользователя
        $user = $request->user();
        $isNewUser = false;

        if (!$user) {
            // Авто-регистрация
            $existingUser = User::where('email', $data['email'])->first();
            if ($existingUser) {
                $user = $existingUser;
            } else {
                $password = Str::random(12);
                $user = User::create([
                    'name' => explode('@', $data['email'])[0],
                    'email' => $data['email'],
                    'password' => Hash::make($password),
                    'password_set_at' => now(),
                ]);
                $isNewUser = true;

                // Отправляем пароль на почту
                try {
                    \Illuminate\Support\Facades\Mail::raw(
                        "Здравствуйте!\n\nВаш аккаунт на AI Астрологе создан автоматически при заказе натальной карты.\n\nEmail: {$data['email']}\nПароль: {$password}\n\nВойдите на https://my.neiro-astro.ru/login\n\nС уважением,\nAI Астролог",
                        function ($message) use ($data) {
                            $message->to($data['email'])->subject('Ваш аккаунт AI Астролога — пароль для входа');
                        }
                    );
                } catch (\Exception $e) {
                    Log::warning('Не удалось отправить пароль', ['error' => $e->getMessage()]);
                }
            }
        }

        // Сохраняем/обновляем профиль
        $profile = UserProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->fill([
            'birth_date' => $data['birth_date'],
            'birth_time' => $data['birth_time'] ?? $profile->birth_time,
            'city' => $data['city'] ?? $profile->city,
            'latitude' => $data['latitude'] ?? $profile->latitude,
            'longitude' => $data['longitude'] ?? $profile->longitude,
        ])->save();

        // Создаём натальную карту (pending)
        $chart = NatalChart::create([
            'user_id' => $user->id,
            'birth_date' => $data['birth_date'],
            'birth_time' => $data['birth_time'],
            'gender' => $data['gender'],
            'city' => $data['city'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'status' => 'pending',
        ]);

        // Создаём заказ
        $order = NatalChartOrder::create([
            'user_id' => $user->id,
            'natal_chart_id' => $chart->id,
            'plan_id' => $plan->id,
            'type' => $data['plan_slug'] === 'natal-chart-weekly' ? 'subscription' : 'one_time',
            'amount' => $plan->price,
            'status' => 'new',
            'weekly_horoscope_opt_in' => (bool) ($data['weekly_horoscope_opt_in'] ?? false),
        ]);

        // Если пользователь выбрал подписку на еженедельный гороскоп
        if ($data['weekly_horoscope_opt_in'] ?? false) {
            $user->update([
                'natal_chart_weekly_opt_in' => true,
                'natal_chart_weekly_subscribed_at' => now(),
            ]);
        }

        // Инициируем оплату в Т-Банке
        $isRecurrent = $data['plan_slug'] === 'natal-chart-weekly';
        $res = $tbank->initNatalChart($order, $plan, $isRecurrent);

        if (!($res['Success'] ?? false)) {
            $order->update(['status' => 'failed', 'payload' => $res]);
            Log::error('TBank NatalChart Init failed', ['res' => $res]);
            return response()->json([
                'success' => false,
                'message' => $res['Message'] ?? 'Ошибка создания платежа',
            ], 400);
        }

        $order->update([
            'tbank_payment_id' => $res['PaymentId'] ?? null,
            'payload' => $res,
        ]);

        return response()->json([
            'success' => true,
            'payment_url' => $res['PaymentURL'] ?? null,
            'order_id' => $order->id,
            'is_new_user' => $isNewUser,
        ]);
    }

    /**
     * Статус заказа
     */
    public function orderStatus(Request $request, int $orderId)
    {
        $order = NatalChartOrder::where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$order) {
            return response()->json(['error' => 'not_found'], 404);
        }

        $chart = $order->natalChart;

        return response()->json([
            'order_status' => $order->status,
            'chart_status' => $chart?->status,
            'chart_ready' => $chart?->status === 'completed',
            'interpretation' => $chart?->status === 'completed' ? $chart->interpretation : null,
        ]);
    }

    /**
     * Webhook оплаты натальной карты
     */
    public function paymentWebhook(Request $request, TBankService $tbank)
    {
        $data = $request->all();
        Log::info('TBank NatalChart webhook', $data);

        if (!$tbank->verify($data)) {
            Log::warning('NatalChart webhook: invalid signature', $data);
            return response()->json(['error' => 'bad signature'], 400);
        }

        $tbankPaymentId = $data['PaymentId'] ?? null;
        $status = $data['Status'] ?? '';

        $order = NatalChartOrder::where('tbank_payment_id', $tbankPaymentId)->first();
        if (!$order) {
            // Может быть обычный платёж, пропускаем
            return response()->json(['success' => true, 'skipped' => true]);
        }

        $order->update(['payload' => $data]);

        if (in_array($status, ['CONFIRMED', 'AUTHORIZED'])) {
            $order->update(['status' => 'paid']);

            // Запускаем генерацию натальной карты
            $chart = $order->natalChart;
            if ($chart && $chart->status === 'pending') {
                $chart->update(['status' => 'generating']);
                
                // Генерируем асинхронно через dispatch
                dispatch(function () use ($chart) {
                    try {
                        // 1. Генерируем SVG-колесо через Python-сервис
                        $svgUrl = 'http://astro-neiro-python:8000/natal-chart/svg?' . http_build_query([
                            'name' => $chart->user->name ?? 'User',
                            'birth_date' => $chart->birth_date->format('Y-m-d'),
                            'birth_time' => $chart->birth_time ?? '12:00',
                            'latitude' => $chart->latitude ?? 55.7558,
                            'longitude' => $chart->longitude ?? 37.6173,
                            'timezone' => $chart->user->profile->timezone ?? 'Europe/Moscow',
                        ]);
                        
                        $svgResponse = \Illuminate\Support\Facades\Http::timeout(30)->get($svgUrl);
                        $svgContent = $svgResponse->successful() ? $svgResponse->body() : null;
                        
                        // Сохраняем SVG в storage
                        $svgPath = null;
                        if ($svgContent && strlen($svgContent) > 1000) {
                            $svgPath = 'natal-charts/chart-' . $chart->id . '.svg';
                            \Illuminate\Support\Facades\Storage::disk('public')->put($svgPath, $svgContent);
                        }
                        
                        // 2. Генерируем AI-интерпретацию
                        $ai = app(AiService::class);
                        $interpretation = $ai->generateNatalChartInterpretation($chart);
                        
                        if ($interpretation) {
                            $chart->update([
                                'interpretation' => $interpretation,
                                'chart_data' => array_merge($chart->chart_data ?? [], ['svg_path' => $svgPath]),
                                'status' => 'completed',
                                'generated_at' => now(),
                            ]);
                            Log::info('Натальная карта сгенерирована', ['chart_id' => $chart->id, 'svg' => $svgPath ? 'yes' : 'no']);
                        } else {
                            $chart->update(['status' => 'failed']);
                            Log::error('Натальная карта: AI вернул null', ['chart_id' => $chart->id]);
                        }
                    } catch (\Exception $e) {
                        $chart->update(['status' => 'failed']);
                        Log::error('Натальная карта exception', ['error' => $e->getMessage()]);
                    }
                });
            }

            // Если подписка — сохраняем rebill_id
            if ($order->type === 'subscription' && !empty($data['RebillId'])) {
                $order->update(['payload' => array_merge($order->payload ?? [], ['rebill_id' => $data['RebillId']])]);
            }
        } elseif (in_array($status, ['REJECTED', 'CANCELLED', 'REFUNDED'])) {
            $order->update(['status' => 'failed']);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Управление подпиской на еженедельный гороскоп по натальной карте
     */
    public function toggleWeeklyHoroscope(Request $request)
    {
        $user = $request->user();
        $hasChart = NatalChart::where('user_id', $user->id)->where('status', 'completed')->exists();

        if (!$hasChart) {
            return response()->json(['success' => false, 'message' => 'Сначала закажите натальную карту'], 400);
        }

        $newState = !$user->natal_chart_weekly_opt_in;
        $user->update([
            'natal_chart_weekly_opt_in' => $newState,
            'natal_chart_weekly_subscribed_at' => $newState ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'weekly_opt_in' => $newState,
        ]);
    }

    /**
     * Получить SVG натальной карты
     */
    public function chartSvg(Request $request, int $chartId)
    {
        $chart = NatalChart::where('id', $chartId)
            ->where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->first();

        if (!$chart) {
            return response()->json(['error' => 'not_found'], 404);
        }

        $svgPath = $chart->chart_data['svg_path'] ?? null;
        if (!$svgPath || !\Illuminate\Support\Facades\Storage::disk('public')->exists($svgPath)) {
            // Генерируем на лету если нет сохранённого
            $svgUrl = 'http://astro-neiro-python:8000/natal-chart/svg?' . http_build_query([
                'name' => $chart->user->name ?? 'User',
                'birth_date' => $chart->birth_date->format('Y-m-d'),
                'birth_time' => $chart->birth_time ?? '12:00',
                'latitude' => $chart->latitude ?? 55.7558,
                'longitude' => $chart->longitude ?? 37.6173,
                'timezone' => $chart->user->profile->timezone ?? 'Europe/Moscow',
            ]);
            
            $response = \Illuminate\Support\Facades\Http::timeout(30)->get($svgUrl);
            if ($response->successful()) {
                return response($response->body())->header('Content-Type', 'image/svg+xml');
            }
            return response()->json(['error' => 'svg_generation_failed'], 500);
        }

        $svg = \Illuminate\Support\Facades\Storage::disk('public')->get($svgPath);
        return response($svg)->header('Content-Type', 'image/svg+xml');
    }
}
