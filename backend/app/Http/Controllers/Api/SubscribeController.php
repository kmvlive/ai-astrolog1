<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class SubscribeController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'sign' => 'nullable|string',
        ]);

        $email = trim(strtolower($request->email));

        // Ищем существующего пользователя
        $user = User::where('email', $email)->first();

        if ($user) {
            // Обновляем подписку
            $user->update(['email_opt_in' => true]);
            
            return response()->json([
                'success' => true,
                'message' => 'Отлично! Завтра в 8:00 придёт первый гороскоп.',
                'existing' => true,
            ]);
        }

        // Создаём нового пользователя без пароля (только email)
        // Генерируем случайный токен — пользователь сможет войти через "magic link" или установить пароль
        $user = User::create([
            'name' => 'Подписчик',
            'email' => $email,
            'password' => Hash::make(Str::random(32)), // пароль, который никто не знает
            'email_opt_in' => true,
            'email_verified_at' => now(), // считаем email подтверждённым (прислал сам)
        ]);

        // Создаём пустой профиль
        $user->profile()->create([
            'timezone' => 'Europe/Moscow',
        ]);

        // Генерируем токен для "magic link" (опционально — для будущего использования)
        $magicToken = $user->createToken('magic-login')->plainTextToken;

        // Отправляем welcome письмо
        $this->sendWelcomeEmail($user, $request->sign);

        return response()->json([
            'success' => true,
            'message' => 'Отлично! Завтра в 8:00 придёт первый гороскоп на ' . $email . '.',
            'existing' => false,
        ]);
    }

    private function sendWelcomeEmail(User $user, ?string $signSlug)
    {
        $signNames = [
            'oven' => 'Овна', 'telec' => 'Тельца', 'bliznecy' => 'Близнецов',
            'rak' => 'Рака', 'lev' => 'Льва', 'deva' => 'Девы',
            'vesy' => 'Весов', 'skorpion' => 'Скорпиона', 'strelec' => 'Стрельца',
            'kozerog' => 'Козерога', 'vodoley' => 'Водолея', 'ryby' => 'Рыб',
        ];
        $signName = $signSlug ? ($signNames[$signSlug] ?? 'вашего знака') : 'вашего знака';

        $html = <<<HTML
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#0369a1,#312e81);">
  <div style="font-size:48px;">📬</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:24px;">Вы подписаны!</h1>
</td></tr>
<tr><td style="padding:32px;color:#e2e8f0;line-height:1.7;">
  <p>Здравствуйте!</p>
  <p>Вы подписались на ежедневный гороскоп для {$signName}. Каждое утро в 8:00 вы будете получать персональное предсказание на этот день.</p>
  <p>А пока — можете построить <strong>полный персональный гороскоп</strong> на основе вашей натальной карты. Это бесплатно 7 дней.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td align="center">
    <a href="https://my.neiro-astro.ru/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;">
      Построить персональный гороскоп
    </a>
  </td></tr>
  </table>
  <p style="color:#94a3b8;font-size:14px;">Если вы не подписывались — просто проигнорируйте это письмо.</p>
</td></tr>
<tr><td style="padding:16px 32px;text-align:center;background:#0f172a;">
  <p style="margin:0;color:#475569;font-size:12px;">
    AI Астролог · my.neiro-astro.ru
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>
HTML;

        $text = "Здравствуйте!\n\nВы подписались на ежедневный гороскоп. Каждое утро в 8:00 — новое предсказание.\n\nПостроить персональный гороскоп: https://my.neiro-astro.ru/dashboard";

        app(UniSenderService::class)->sendEmail(
            $user->email,
            "📬 Вы подписаны на гороскоп!",
            $html,
            $text
        );
    }
}
