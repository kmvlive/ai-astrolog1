<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\TBankService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function init(Request $request, TBankService $tbank)
    {
        $data = $request->validate([
            'plan_id' => 'required|integer|exists:plans,id',
            'auto_renew' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $plan = Plan::findOrFail($data['plan_id']);

        if (!$plan->active) {
            return response()->json(['success' => false, 'message' => 'Тариф недоступен'], 400);
        }

        // Блокируем повторную оплату того же тарифа при активной подписке
        $activeSub = \App\Models\Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->where('plan_type', $plan->slug)
            ->where('expires_at', '>', now())
            ->first();
        if ($activeSub) {
            return response()->json([
                'success' => false,
                'code' => 'ALREADY_ACTIVE',
                'message' => 'У вас уже активна подписка «' . $plan->name . '» до ' . $activeSub->expires_at->locale('ru')->isoFormat('D MMMM YYYY'),
            ], 400);
        }

        // Создаём платёж
        $payment = Payment::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'amount'  => $plan->price,
            'status'  => 'NEW',
            'auto_renew' => (bool) ($data['auto_renew'] ?? false),
        ]);

        // Инициируем в Т-Банке
        $res = $tbank->init($payment, (bool) ($data['auto_renew'] ?? false));

        if (!($res['Success'] ?? false)) {
            $payment->update([
                'status' => 'FAILED',
                'payload' => $res,
            ]);
            Log::error('TBank Init failed', ['res' => $res]);
            return response()->json([
                'success' => false,
                'message' => $res['Message'] ?? 'Ошибка создания платежа',
            ], 400);
        }

        $payment->update([
            'tbank_payment_id' => $res['PaymentId'] ?? null,
            'status' => 'NEW',
            'payload' => $res,
        ]);

        return response()->json([
            'success' => true,
            'payment_url' => $res['PaymentURL'] ?? $res['PaymentId'],
            'payment_id' => $payment->id,
        ]);
    }

    /** Последний платёж пользователя за 10 минут */
    public function last(Request $request)
    {
        $payment = \App\Models\Payment::where('user_id', $request->user()->id)
            ->where('created_at', '>', now()->subMinutes(10))
            ->orderByDesc('id')
            ->first();
        return response()->json(['payment_id' => $payment?->id]);
    }

    /** Проверка статуса платежа с нашей стороны (polling с фронтенда) */
    public function status(Request $request, Payment $payment, TBankService $tbank)
    {
        if ($payment->user_id !== $request->user()->id) {
            return response()->json(['success' => false], 403);
        }

        if ($payment->status === 'PAID') {
            return response()->json(['success' => true, 'status' => 'PAID']);
        }

        if (!$payment->tbank_payment_id) {
            return response()->json(['success' => true, 'status' => $payment->status]);
        }

        $res = $tbank->getState($payment->tbank_payment_id);
        $status = $res['Status'] ?? 'UNKNOWN';

        // Нормализуем
        if (in_array($status, ['CONFIRMED', 'AUTHORIZED'])) {
            $this->activate($payment);
            return response()->json(['success' => true, 'status' => 'PAID']);
        }

        return response()->json(['success' => true, 'status' => $status]);
    }

    /** Активация подписки (вызывается из status и webhook) */
    public function activate(Payment $payment, bool $skipRenewedEmail = false): void
    {
        if ($payment->status === 'PAID') return;

        $payment->update(['status' => 'PAID']);

        $user = $payment->user;
        $plan = $payment->plan;

        // Если есть активная подписка — продлеваем, иначе создаём
        $sub = Subscription::where('user_id', $user->id)
            ->whereIn('status', ['active', 'trial'])
            ->orderByDesc('expires_at')
            ->first();

        $startDate = $sub && $sub->expires_at && $sub->expires_at->isFuture()
            ? $sub->expires_at
            : now();

        $newExpires = $startDate->copy()->addDays($plan->duration_days);

        if ($sub) {
            $sub->update([
                'status' => 'active',
                'plan_type' => $plan->slug,
                'amount' => $plan->price,
                'expires_at' => $newExpires,
                'tbank_payment_id' => $payment->tbank_payment_id,
            ]);
        } else {
            Subscription::create([
                'user_id' => $user->id,
                'status' => 'active',
                'plan_type' => $plan->slug,
                'amount' => $plan->price,
                'expires_at' => $newExpires,
                'tbank_payment_id' => $payment->tbank_payment_id,
            ]);
        }

        Log::info("Подписка активирована", [
            'user' => $user->id,
            'plan' => $plan->slug,
            'expires' => $newExpires,
        ]);

        // Onboarding: первое письмо — только один раз
        $onboarding = app(\App\Services\OnboardingService::class);
        if (!$user->onboarding_sent_at) {
            if ($onboarding->sendWelcome($user, $plan->name, $newExpires)) {
                $user->update(['onboarding_sent_at' => now()]);
                Log::info('Onboarding отправлен', ['user' => $user->id]);
            }
        } elseif (!$skipRenewedEmail) {
            $onboarding->sendRenewed($user, $plan->name, $newExpires);
        }
    }

    public function history(Request $request)
    {
        $payments = Payment::where('user_id', $request->user()->id)
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'plan_name' => $p->plan->name ?? 'Тариф',
                    'amount' => $p->amount,
                    'status' => $p->status,
                    'created_at' => $p->created_at->toISOString(),
                ];
            });

        return response()->json(['payments' => $payments]);
    }
}
