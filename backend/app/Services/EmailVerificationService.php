<?php

namespace App\Services;

use App\Models\User;
use App\Models\DeliveryLog;
use Illuminate\Support\Str;

class EmailVerificationService
{
    public function __construct(
        private UniSenderService $uniSender,
    ) {}

    public function sendVerification(User $user): bool
    {
        // Страховка: подтверждённому email никогда не шлём повторное письмо
        if ($user->email_verified_at) {
            return true;
        }

        // Генерируем токен
        $token = Str::random(64);
        $user->update([
            'email_verification_token' => $token,
            'email_verification_sent_at' => now(),
        ]);

        $verifyUrl = env('APP_FRONTEND_URL', 'https://my.neiro-astro.ru') 
            . '/verify-email?token=' . $token;

        $html = $this->buildHtml($user->name, $verifyUrl);
        $text = "Привет, {$user->name}! Подтвердите ваш email, перейдя по ссылке: $verifyUrl";

        $success = $this->uniSender->sendEmail(
            $user->email,
            'Подтвердите ваш email — AI Астролог ✨',
            $html,
            $text
        );

        // Лог в delivery_logs (без привязки к гороскопу)
        DeliveryLog::create([
            'user_id' => $user->id,
            'status' => $success ? 'sent' : 'failed',
            'sent_at' => $success ? now() : null,
        ]);

        return $success;
    }

    public function verify(string $token): ?User
    {
        $user = User::where('email_verification_token', $token)->first();
        if (!$user) return null;

        $user->update([
            'email_verified_at' => now(),
            'email_verification_token' => null,
            'email_verification_sent_at' => null,
        ]);

        return $user;
    }

    private function buildHtml(string $name, string $verifyUrl): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
    <tr>
        <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:48px;">✨</div>
            <h1 style="color:white;margin:12px 0 0;font-size:28px;font-weight:700;">AI Астролог</h1>
        </td>
    </tr>
    <tr>
        <td style="padding:40px 32px;color:#e2e8f0;">
            <h2 style="color:white;margin:0 0 16px;font-size:24px;">Привет, {$name}! 👋</h2>
            <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#cbd5e1;">
                Спасибо за регистрацию в <strong style="color:#f59e0b;">AI Астрологе</strong>!
                <br>Чтобы начать получать персональные гороскопы, подтвердите ваш email.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                    <td align="center">
                        <a href="{$verifyUrl}" 
                           style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(245,158,11,0.4);">
                            ✨ Подтвердить email
                        </a>
                    </td>
                </tr>
            </table>
            <p style="font-size:14px;color:#94a3b8;margin:24px 0 0;text-align:center;">
                Если вы не регистрировались — просто проигнорируйте это письмо.
            </p>
        </td>
    </tr>
    <tr>
        <td style="background:#0f172a;padding:24px 32px;text-align:center;color:#64748b;font-size:13px;">
            <p style="margin:0;">© 2026 AI Астролог · my.neiro-astro.ru</p>
            <p style="margin:8px 0 0;font-size:12px;">Персональные гороскопы на основе AI</p>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
