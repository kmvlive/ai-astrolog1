<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\TBankService;
use App\Services\UniSenderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoRenewSubscriptions extends Command
{
    protected $signature = 'subscriptions:auto-renew {--test= : user_id для теста}';
    protected $description = 'Автосписание за 1 день до окончания подписки (рекурренты Т-Банка)';

    public function handle(TBankService $tbank, UniSenderService $mail): int
    {
        $query = Subscription::where('status', 'active')
            ->where('auto_renew', true)
            ->whereNotNull('rebill_id')
            ->whereBetween('expires_at', [now()->addDay()->startOfDay(), now()->addDay()->endOfDay()])
            ->with('user');

        if ($test = $this->option('test')) {
            $query->where('user_id', $test);
        }

        $subs = $query->get();
        $this->info("Подписок к продлению: {$subs->count()}");

        foreach ($subs as $sub) {
            $user = $sub->user;
            $plan = Plan::where('slug', $sub->plan_type)->first();
            if (!$user || !$plan) continue;

            $orderId = 'renew_' . $sub->id . '_' . now()->format('Ymd');
            $payment = Payment::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'amount' => $plan->price,
                'status' => 'NEW',
            ]);

            $res = $tbank->chargeRebill(
                $sub->rebill_id,
                (int) $plan->price,
                $orderId,
                'AI Астролог — автопродление «' . $plan->name . '»'
            );

            $status = $res['Status'] ?? '';
            if (($res['Success'] ?? false) && in_array($status, ['CONFIRMED', 'AUTHORIZED'])) {
                $payment->update([
                    'tbank_payment_id' => (string) ($res['PaymentId'] ?? ''),
                    'status' => 'PAID',
                    'payload' => $res,
                ]);
                app(\App\Http\Controllers\Api\PaymentController::class)->activate($payment, true); // письмо шлёт сама команда
                $sub->update(['last_rebill_at' => now()]);

                $this->info("✓ Продлено: {$user->email} ({$plan->price} коп)");
                Log::info('Auto-renew OK', ['user' => $user->id, 'amount' => $plan->price]);

                if ($user->email) {
                    [$html, $text] = $this->renewedLetter($user->name, $plan->name, $plan->price, $sub);
                    $mail->sendEmail($user->email, '✅ Подписка продлена автоматически', $html, $text);
                }
            } else {
                $payment->update(['status' => 'FAILED', 'payload' => $res]);
                $this->error("✗ Ошибка: {$user->email} — " . ($res['Message'] ?? $status));
                Log::error('Auto-renew FAILED', ['user' => $user->id, 'res' => $res]);

                if ($user->email) {
                    [$html, $text] = $this->failedLetter($user->name, $plan->name, $plan->price);
                    $mail->sendEmail($user->email, '⚠️ Не удалось продлить подписку', $html, $text);
                }
            }
        }

        return self::SUCCESS;
    }

    private function renewedLetter(?string $name, string $plan, int $priceCop, Subscription $sub): array
    {
        $rub = number_format($priceCop / 100, 0, ',', ' ');
        $expires = $sub->fresh()->expires_at?->locale('ru')->isoFormat('D MMMM YYYY') ?? '—';
        $html = "<div style='font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;'><div style='max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;padding:32px;'><h1 style='color:#4ade80;'>✅ Подписка продлена!</h1><p>Здравствуйте, " . e($name ?? 'друг') . "!</p><p>Мы списали <b>{$rub} ₽</b> за тариф «{$plan}». Подписка активна до <b style='color:#fbbf24;'>{$expires}</b>.</p><p style='color:#94a3b8;'>Отключить автопродление можно в кабинете в любой момент.</p></div></div>";
        $text = "Подписка продлена! Списано {$rub} ₽ за тариф «{$plan}». Активна до {$expires}.";
        return [$html, $text];
    }

    private function failedLetter(?string $name, string $plan, int $priceCop): array
    {
        $rub = number_format($priceCop / 100, 0, ',', ' ');
        $url = 'https://my.neiro-astro.ru/pricing';
        $html = "<div style='font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;'><div style='max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;padding:32px;'><h1 style='color:#f87171;'>⚠️ Не удалось продлить подписку</h1><p>Здравствуйте, " . e($name ?? 'друг') . "!</p><p>Мы попытались списать <b>{$rub} ₽</b> за тариф «{$plan}», но карта отклонила платёж.</p><p>Продлите подписку вручную, чтобы не потерять доступ:</p><p><a href='{$url}' style='color:#a78bfa;'>Продлить подписку →</a></p></div></div>";
        $text = "Не удалось списать {$rub} ₽ за «{$plan}». Продлите вручную: {$url}";
        return [$html, $text];
    }
}
