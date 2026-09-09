<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MagicLinkController extends Controller
{
    public function request(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $email = trim(strtolower($request->email));

        $user = User::where('email', $email)->first();

        if ($user) {
            // Защита от спама: не чаще раза в 60 секунд
            $last = Cache::get('magic_throttle:' . $email);
            if (!$last || $last->lt(now()->subMinute())) {
                Cache::put('magic_throttle:' . $email, now(), now()->addMinutes(5));

                // Stateless-ссылка: подпись HMAC, без кеша
                $expires = now()->addMinutes(30)->getTimestamp();
                $signature = hash_hmac('sha256', $user->id . '|' . $expires, config('app.key'));

                $url = env('APP_FRONTEND_URL', 'https://my.neiro-astro.ru')
                    . '/magic-login?uid=' . $user->id
                    . '&expires=' . $expires
                    . '&signature=' . $signature;

                [$html, $text] = $this->buildEmail($url);

                app(UniSenderService::class)->sendEmail(
                    $email,
                    '🔑 Ваша ссылка для входа — AI Астролог',
                    $html,
                    $text
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Если этот email зарегистрирован — мы отправили ссылку для входа.',
        ]);
    }

    public function verify(Request $request)
    {
        $uid = (int) $request->input('uid');
        $expires = (int) $request->input('expires');
        $signature = (string) $request->input('signature');

        if (!$uid || !$expires || !$signature) {
            return response()->json(['success' => false, 'message' => 'Некорректная ссылка.'], 400);
        }

        if (now()->getTimestamp() > $expires) {
            return response()->json(['success' => false, 'message' => 'Ссылка истекла. Запросите новую.'], 400);
        }

        $expected = hash_hmac('sha256', $uid . '|' . $expires, config('app.key'));
        if (!hash_equals($expected, $signature)) {
            return response()->json(['success' => false, 'message' => 'Ссылка недействительна. Запросите новую.'], 400);
        }

        $user = User::find($uid);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Пользователь не найден'], 404);
        }

        // Клик по ссылке из письма = подтверждение владения email
        if (!$user->email_verified_at) {
            $user->update(['email_verified_at' => now()]);
        }

        $token = $user->createToken('magic-login')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user->load('profile'),
            'has_password' => (bool) $user->password_set_at,
        ]);
    }

    private function buildEmail(string $url): array
    {
        $html = <<<HTML
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">
    <tr>
        <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:48px;">🔑</div>
            <h1 style="color:white;margin:12px 0 0;font-size:26px;font-weight:700;">Вход в AI Астролог</h1>
        </td>
    </tr>
    <tr>
        <td style="padding:40px 32px;color:#e2e8f0;">
            <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
                Вы запросили ссылку для входа. Нажмите кнопку — и вы окажетесь в личном кабинете, где можно управлять подпиской и гороскопами.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                    <td align="center">
                        <a href="{$url}"
                           style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">
                            ✨ Войти в один клик
                        </a>
                    </td>
                </tr>
            </table>
            <p style="font-size:13px;color:#94a3b8;margin:0;text-align:center;">
                Ссылка действует 30 минут.<br>
                Если вы не запрашивали вход — просто проигнорируйте письмо.
            </p>
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

        $text = "Ваша ссылка для входа (действует 30 минут): $url";

        return [$html, $text];
    }
}
