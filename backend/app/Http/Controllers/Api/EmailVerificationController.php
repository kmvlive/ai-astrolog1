<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * GET /api/verify-email?token=... — клик по ссылке из письма
     */
    public function verifyGet(Request $request, EmailVerificationService $service)
    {
        $token = $request->query('token');

        if (!$token) {
            return $this->resultPage(false, 'Ссылка недействительна — отсутствует токен подтверждения.');
        }

        $user = $service->verify($token);

        if (!$user) {
            return $this->resultPage(false, 'Ссылка недействительна или уже была использована. Попробуйте запросить новое письмо.');
        }

        return $this->resultPage(true, "Добро пожаловать, {$user->name}! Ваш email подтверждён — персональные гороскопы уже летят к вам. ✨");
    }

    /**
     * POST /api/verify-email — для API-клиентов
     */
    public function verify(Request $request, EmailVerificationService $service)
    {
        $request->validate(['token' => 'required|string']);

        $user = $service->verify($request->token);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Неверная или истёкшая ссылка подтверждения',
            ], 400);
        }

        $token = $user->createToken('post-verify')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Email успешно подтверждён!',
            'user' => $user->load('profile'),
            'token' => $token,
        ]);
    }

    public function resend(Request $request, EmailVerificationService $service)
    {
        $request->validate(['email' => 'required|email']);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Пользователь не найден'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['success' => true, 'message' => 'Email уже подтверждён']);
        }

        if ($user->email_verification_sent_at && $user->email_verification_sent_at->gt(now()->subMinute())) {
            return response()->json(['success' => false, 'message' => 'Письмо отправлено недавно. Попробуйте через минуту.'], 429);
        }

        $success = $service->sendVerification($user);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Письмо подтверждения отправлено' : 'Ошибка отправки',
        ]);
    }

    private function resultPage(bool $success, string $message)
    {
        $icon = $success ? '✅' : '😔';
        $color = $success ? '#10b981' : '#ef4444';
        $title = $success ? 'Email подтверждён!' : 'Не получилось';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$title} — AI Астролог</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 16px;min-height:100vh;">
<tr><td align="center" valign="middle">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
    <tr>
        <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:48px 32px;text-align:center;">
            <div style="font-size:64px;">{$icon}</div>
            <h1 style="color:white;margin:16px 0 0;font-size:30px;font-weight:700;">{$title}</h1>
        </td>
    </tr>
    <tr>
        <td style="padding:40px 32px;text-align:center;">
            <p style="color:#e2e8f0;font-size:17px;line-height:1.7;margin:0 0 32px;">{$message}</p>
            <a href="https://my.neiro-astro.ru"
               style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
                ✨ Перейти к гороскопу
            </a>
        </td>
    </tr>
    <tr>
        <td style="background:#0f172a;padding:20px 32px;text-align:center;color:#64748b;font-size:13px;">
            © 2026 AI Астролог · my.neiro-astro.ru
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;

        return response($html, $success ? 200 : 400);
    }
}
