<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;

class OnboardingService
{
    public function __construct(private UniSenderService $uniSender) {}

    /** Первое письмо после первой оплаты */
    public function sendWelcome(User $user, string $planName, ?string $expiresAt): bool
    {
        $expires = $expiresAt ? Carbon::parse($expiresAt)->locale('ru')->isoFormat('D MMMM YYYY') : '—';
        $html = $this->buildWelcomeHtml($user->name, $planName, $expires);
        $text = "Добро пожаловать в AI Астролог, {$user->name}! Подписка «{$planName}» активна до {$expires}.\n\n1. Заполните профиль: https://my.neiro-astro.ru/profile\n2. Подключите Telegram: https://my.neiro-astro.ru/dashboard\n3. Настройте типы гороскопов: https://my.neiro-astro.ru/dashboard";

        return $this->uniSender->sendEmail($user->email, '🎉 Добро пожаловать в AI Астролог!', $html, $text);
    }

    /** Письмо при ручном продлении */
    public function sendRenewed(User $user, string $planName, ?string $expiresAt): bool
    {
        $expires = $expiresAt ? Carbon::parse($expiresAt)->locale('ru')->isoFormat('D MMMM YYYY') : '—';
        $html = $this->wrap("
            <h2 style='color:white;margin:0 0 16px;font-size:24px;'>✅ Подписка продлена!</h2>
            <p style='font-size:16px;line-height:1.6;color:#cbd5e1;margin:0 0 24px;'>
                Здравствуйте, {$user->name}! Тариф «<strong style='color:#f59e0b;'>{$planName}</strong>» активен до <strong style='color:#fbbf24;'>{$expires}</strong>.
            </p>
            <p style='font-size:15px;line-height:1.6;color:#cbd5e1;'>
                Каждый день в 8:00 вас ждёт персональный гороскоп — на почте и в Telegram. ✨
            </p>
        ", 'https://my.neiro-astro.ru/dashboard', 'Открыть кабинет');

        return $this->uniSender->sendEmail($user->email, '✅ Подписка продлена — гороскопы ждут вас!', $html, "Подписка «{$planName}» продлена до {$expires}.");
    }

    private function buildWelcomeHtml(string $name, string $planName, string $expires): string
    {
        $steps = "
            <table width='100%' cellpadding='0' cellspacing='0' style='margin:24px 0;'>
                <tr><td style='padding:14px 16px;background:#0f172a;border-radius:12px;border-left:4px solid #f59e0b;margin-bottom:12px;'>
                    <div style='color:white;font-weight:600;font-size:15px;'>1️⃣ Заполните профиль</div>
                    <div style='color:#94a3b8;font-size:13px;margin-top:4px;'>Дата, время и место рождения делают прогнозы точными именно для вас.</div>
                </td></tr>
                <tr><td style='height:10px;'></td></tr>
                <tr><td style='padding:14px 16px;background:#0f172a;border-radius:12px;border-left:4px solid #8b5cf6;'>
                    <div style='color:white;font-weight:600;font-size:15px;'>2️⃣ Подключите Telegram</div>
                    <div style='color:#94a3b8;font-size:13px;margin-top:4px;'>Гороскопы в мессенджере открываются чаще, чем почта — в 3 раза.</div>
                </td></tr>
                <tr><td style='height:10px;'></td></tr>
                <tr><td style='padding:14px 16px;background:#0f172a;border-radius:12px;border-left:4px solid #22c55e;'>
                    <div style='color:white;font-weight:600;font-size:15px;'>3️⃣ Выберите темы</div>
                    <div style='color:#94a3b8;font-size:13px;margin-top:4px;'>Любовь, карьера, финансы, здоровье — получайте только то, что важно вам.</div>
                </td></tr>
            </table>
        ";

        $body = "
            <h2 style='color:white;margin:0 0 16px;font-size:24px;'>Привет, {$name}! 🎉</h2>
            <p style='font-size:16px;line-height:1.6;color:#cbd5e1;margin:0 0 16px;'>
                Спасибо за доверие! Подписка «<strong style='color:#f59e0b;'>{$planName}</strong>» активна до <strong style='color:#fbbf24;'>{$expires}</strong>.
            </p>
            <p style='font-size:15px;line-height:1.6;color:#cbd5e1;margin:0 0 8px;'>
                <strong style='color:white;'>Что уже работает:</strong><br>
                📬 Ежедневный гороскоп в 8:00 на почту<br>
                🔮 Персональные прогнозы на сайте — день, неделя, месяц, год<br>
                🤖 Telegram-бот с доставкой в мессенджер
            </p>
            {$steps}
            <table width='100%' cellpadding='0' cellspacing='0' style='margin:24px 0;'>
                <tr><td align='center'>
                    <a href='https://my.neiro-astro.ru/dashboard'
                       style='display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;'>
                        ✨ Начать — открыть кабинет
                    </a>
                </td></tr>
            </table>
            <p style='font-size:13px;color:#64748b;margin:16px 0 0;text-align:center;'>
                Автопродление можно отключить в кабинете в один клик.
            </p>
        ";

        return $this->wrap($body, null, null);
    }

    private function wrap(string $body, ?string $btnUrl, ?string $btnText): string
    {
        $btn = '';
        if ($btnUrl) {
            $btn = "<table width='100%' cellpadding='0' cellspacing='0' style='margin:24px 0;'><tr><td align='center'><a href='{$btnUrl}' style='display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;'>{$btnText}</a></td></tr></table>";
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">
    <tr>
        <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:32px;text-align:center;">
            <div style="font-size:44px;">🔮</div>
            <h1 style="color:white;margin:10px 0 0;font-size:26px;font-weight:700;">AI Астролог</h1>
        </td>
    </tr>
    <tr>
        <td style="padding:36px 32px;color:#e2e8f0;">
            {$body}
            {$btn}
        </td>
    </tr>
    <tr>
        <td style="background:#0f172a;padding:20px 32px;text-align:center;color:#64748b;font-size:12px;">
            © 2026 AI Астролог · my.neiro-astro.ru · Персональные гороскопы на основе AI
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
