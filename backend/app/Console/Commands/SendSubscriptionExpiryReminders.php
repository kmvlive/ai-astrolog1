<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\UniSenderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendSubscriptionExpiryReminders extends Command
{
    protected $signature = 'subscriptions:expiry-reminders {--test= : Отправить тестовое письмо}';
    protected $description = 'Email за 3 дня до окончания подписки (через UniSender)';

    public function handle(): int
    {
        $testEmail = $this->option('test');
        $target = now()->addDays(3)->toDateString();
        $service = app(UniSenderService::class);

        $query = Subscription::where('status', 'active')
            ->whereDate('expires_at', $target)
            ->with('user');

        if ($testEmail) {
            $query->whereHas('user', fn ($q) => $q->where('email', $testEmail));
        }

        $subs = $query->get();
        $this->info("Найдено подписок: {$subs->count()}");

        $sent = 0;
        foreach ($subs as $sub) {
            if (!$sub->user || !$sub->user->email) {
                $this->warn("Пропущен user_id={$sub->user_id}: нет email");
                continue;
            }

            try {
                [$html, $text] = $this->buildLetter($sub);
                $ok = $service->sendEmail(
                    $sub->user->email,
                    '🌙 Ваша подписка заканчивается через 3 дня',
                    $html,
                    $text
                );

                if ($ok) {
                    $this->info("✓ Отправлено: {$sub->user->email}");
                    $sent++;
                } else {
                    $this->error("✗ Ошибка UniSender: {$sub->user->email}");
                }
            } catch (\Throwable $e) {
                $this->error("Ошибка {$sub->user->email}: {$e->getMessage()}");
                Log::error('Expiry reminder failed', [
                    'user_id' => $sub->user_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Готово. Отправлено: $sent");
        return self::SUCCESS;
    }

    private function buildLetter(Subscription $sub): array
    {
        $names = ['week' => 'Неделя', 'month' => 'Месяц', 'year' => 'Год'];
        $userName = $sub->user->name ?? 'друг';
        $planName = $names[$sub->plan_type] ?? $sub->plan_type;
        $expiresAt = $sub->expires_at?->locale('ru')->isoFormat('D MMMM YYYY') ?? '—';
        $frontendUrl = env('APP_FRONTEND_URL', 'https://my.neiro-astro.ru');
        $renewUrl = rtrim($frontendUrl, '/') . '/pricing';

        // Подписанная ссылка отписки
        $unsubSig = hash_hmac('sha256', (string) $sub->user_id, config('app.key'));
        $unsubUrl = rtrim($frontendUrl, '/') . "/api/unsubscribe/{$sub->user_id}/{$unsubSig}";

        $html = <<<HTML
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#4c1d95,#312e81);">
  <div style="font-size:48px;">🌙</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:24px;">Подписка заканчивается</h1>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 20px;color:#e2e8f0;font-size:15px;line-height:1.6;">Здравствуйте, {$userName}!</p>
  <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
    Ваша подписка <b style="color:#c4b5fd;">«{$planName}»</b> заканчивается <b style="color:#fbbf24;">{$expiresAt}</b> — через 3 дня.
  </p>
  <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.6;">
    Продлите сейчас, чтобы не потерять персональные гороскопы, натальную карту и утренние письма.
  </p>
  <p style="text-align:center;margin:0 0 24px;">
    <a href="{$renewUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;">
      Продлить подписку →
    </a>
  </p>
  <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
    Если вы уже продлили подписку — просто игнорируйте это письмо. ✨
  </p>
</td></tr>
<tr><td style="padding:24px 32px;text-align:center;background:#0f172a;border-top:1px solid #1e293b;">
  <a href="{$unsubUrl}" style="color:#ef4444;text-decoration:none;font-size:13px;font-weight:600;">
    ❌ Отписаться от рассылки
  </a>
  <p style="margin:12px 0 0;color:#475569;font-size:11px;line-height:1.5;">
    AI Астролог · {$frontendUrl}
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>
HTML;

        $text = "Здравствуйте, {$userName}!\n\n"
            . "Ваша подписка «{$planName}» заканчивается {$expiresAt} — через 3 дня.\n\n"
            . "Продлите сейчас, чтобы не потерять персональные гороскопы, натальную карту и утренние письма.\n\n"
            . "Продлить подписку: {$renewUrl}\n\n"
            . "---\n"
            . "Если вы уже продлили подписку — просто игнорируйте это письмо.\n\n"
            . "AI Астролог · {$frontendUrl}\n"
            . "Отписаться: {$unsubUrl}\n";

        return [$html, $text];
    }
}
