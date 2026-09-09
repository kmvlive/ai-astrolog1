<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\User;
use Illuminate\Http\Request;

class UnsubscribeController extends Controller
{
    /**
     * Отписка в один клик из письма.
     * Ссылка подписана HMAC — подделать нельзя, хранить токен не нужно.
     */
    public function unsubscribe(Request $request, int $userId, string $signature)
    {
        $expected = hash_hmac('sha256', (string) $userId, config('app.key'));

        if (!hash_equals($expected, $signature)) {
            return $this->page('😕', 'Ссылка недействительна', 'Обратитесь в поддержку или войдите в личный кабинет.');
        }

        $user = User::find($userId);
        if (!$user) {
            return $this->page('😕', 'Пользователь не найден', 'Возможно, аккаунт уже удалён.');
        }

        $user->update(['email_opt_in' => false]);

        $emailChannel = Channel::where('slug', 'email')->first();
        if ($emailChannel) {
            $user->channels()->detach($emailChannel->id);
        }

        return $this->page('✅', 'Вы отписаны от рассылки', 'Гороскопы больше приходить не будут. Если передумаете — подпишитесь заново на my.neiro-astro.ru.');
    }

    private function page(string $icon, string $title, string $text)
    {
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{$title}</title></head>
<body style="margin:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:48px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1e293b;border-radius:16px;overflow:hidden;text-align:center;">
    <tr><td style="padding:48px 32px;">
        <div style="font-size:56px;">{$icon}</div>
        <h1 style="color:white;font-size:24px;margin:16px 0 8px;">{$title}</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">{$text}</p>
        <a href="https://my.neiro-astro.ru" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;text-decoration:none;border-radius:12px;font-weight:600;">На сайт</a>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }
}
