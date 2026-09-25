<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UniSenderService
{
    private string $baseUrl = 'https://goapi.unisender.ru/ru/transactional/api/v1';

    public function sendEmail(string $to, string $subject, string $html, string $text): bool
    {
        $apiKey = env('UNISENDER_API_KEY');
        if (!$apiKey) {
            Log::warning('UNISENDER_API_KEY not set');
            return false;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'X-API-KEY' => $apiKey,
                ])
                ->post("{$this->baseUrl}/email/send.json", [
                    'message' => [
                        'recipients' => [
                            ['email' => $to],
                        ],
                        'subject' => $subject,
                        'from_email' => env('UNISENDER_FROM_EMAIL', 'no-reply@my.neiro-astro.ru'),
                        'from_name' => env('UNISENDER_FROM_NAME', 'AI Астролог'),
                        'body' => [
                            'html' => $html,
                            'plaintext' => $text,
                        ],
                        'skip_unsubscribe' => 0,
                        'global_language' => 'ru',
                    ],
                ]);

            $data = $response->json();

            if ($response->successful() && ($data['status'] ?? '') === 'success') {
                $jobId = $data['job_id'] ?? null;
                Log::info('UniSender Go: sent', [
                    'to' => $to,
                    'job_id' => $jobId,
                    'status' => 'success',
                ]);
                return true;
            }

            // Проверяем, не отписался ли пользователь
            $failedEmails = $data['failed_emails'] ?? [];
            foreach ($failedEmails as $email => $reason) {
                if ($reason === 'unsubscribed') {
                    $user = \App\Models\User::where('email', $email)->first();
                    if ($user && !$user->unsubscribed_at) {
                        $user->unsubscribed_at = now();
                        $user->save();
                        \Log::info('User marked as unsubscribed', ['email' => $email, 'user_id' => $user->id]);
                    }
                }
            }

            // Логируем как INFO (не ERROR), так как отписка - нормальное событие
            \Log::info('UniSender Go: delivery failed', [
                'status' => $response->status(),
                'response' => $data,
                'to' => $to,
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('UniSender Go exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Обрезать текст примерно пополам, не разрывая предложения
     */
    public function truncateHalf(string $content): string
    {
        // Разбиваем на предложения
        $sentences = preg_split('/(?<=[.!?])\s+(?=[А-ЯЁA-Z])/u', $content);
        $sentences = array_filter($sentences, fn($s) => trim($s) !== '');
        $sentences = array_values($sentences);

        if (count($sentences) <= 1) {
            // Если одно предложение — берём половину символов
            $halfLen = (int) (mb_strlen($content) / 2);
            $cutPos = mb_strpos($content, ' ', $halfLen);
            return $cutPos ? mb_substr($content, 0, $cutPos) . '...' : $content;
        }

        // Берём первые ~50% предложений (минимум 1)
        $halfCount = max(1, (int) ceil(count($sentences) / 2));
        $truncated = implode(' ', array_slice($sentences, 0, $halfCount));
        return rtrim($truncated, '.!? ') . '...';
    }

    /**
     * Построить письмо со сводкой — несколько типов с обрезкой и ссылками
     * @param array $sections Массив ['emoji', 'name', 'truncated', 'url', 'signSlug']
     */
    public function buildDailyDigestEmail(
        string $name,
        string $signName,
        string $signEmoji,
        string $dateRu,
        array $sections,
        int $userId = 0,
        ?\App\Models\BlogPost $blog = null
    ): array {
        // Подписанная ссылка отписки в один клик (требование закона)
        $frontendUrl = env('APP_FRONTEND_URL', 'https://my.neiro-astro.ru');
        $unsubSig = $userId ? hash_hmac('sha256', (string) $userId, config('app.key')) : '';
        $unsubUrl = $userId ? rtrim($frontendUrl, '/') . "/api/unsubscribe/{$userId}/{$unsubSig}" : '';
$sectionsHtml = '';
        $sectionsText = '';

        $blogHtml = '';
        if ($blog) {
            $coverUrl = $blog->cover_image ? asset('storage/' . $blog->cover_image) : '';
            $blogUrl = route('blog.show', $blog);
            $coverBlock = $coverUrl ? '<img src="' . $coverUrl . '" width="600" style="width:100%;height:auto;display:block;" alt="">' : '';
            $excerpt = htmlspecialchars($blog->excerpt ?: mb_substr(strip_tags($blog->content), 0, 160), ENT_XML1);
            $title = htmlspecialchars($blog->title, ENT_XML1);
            $blogHtml = <<<HTML
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;margin-bottom:28px;background:#0f172a;border-radius:12px;overflow:hidden;border:1px solid #334155;">
  <tr><td>
    {$coverBlock}
    <div style="padding:20px 24px;">
      <div style="font-size:11px;font-weight:bold;color:#a78bfa;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📝 Сегодня в блоге</div>
      <h3 style="margin:0 0 10px;color:#fff;font-size:20px;line-height:1.3;">{$title}</h3>
      <p style="margin:0 0 16px;color:#cbd5e1;font-size:14px;line-height:1.6;">{$excerpt}</p>
      <a href="{$blogUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:bold;">
        Читать в блоге →
      </a>
    </div>
  </td></tr>
  </table>
HTML;
        }

        // Персональный гороскоп (если есть)



        foreach ($sections as $s) {
            $sectionsHtml .= <<<HTML
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
<tr><td style="padding:16px 20px;background:#1e293b;border-radius:12px;border-left:4px solid #7c3aed;">
  <div style="font-size:18px;font-weight:bold;color:#c4b5fd;margin-bottom:8px;">
    {$s['emoji']} {$s['name']}
  </div>
  <p style="margin:0 0 16px;line-height:1.7;color:#cbd5e1;">
    {$s['truncated']}
  </p>
  <a href="{$s['url']}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:bold;">
    Читать полностью →
  </a>
</td></tr>
</table>
HTML;
            $sectionsText .= "\n{$s['emoji']} {$s['name']}\n{$s['truncated']}\nЧитать полностью: {$s['url']}\n";
        }

        $html = <<<HTML
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#4c1d95,#312e81);">
  <div style="font-size:48px;">{$signEmoji}</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:24px;">Ваш гороскоп на {$dateRu}</h1>
  <p style="margin:4px 0 0;color:#c4b5fd;">{$signName}</p>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 20px;color:#94a3b8;">Здравствуйте, {$name}!</p>
  {$sectionsHtml}
  {$blogHtml}

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:linear-gradient(135deg,#7c3aed,#4c1d95);border-radius:12px;overflow:hidden;">
  <tr><td style="padding:24px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">💎</div>
    <div style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:12px;">
      Хотите прогноз, составленный лично для вас?
    </div>
    <p style="color:#ddd6fe;font-size:13px;line-height:1.6;margin:0 0 16px;">
      По дате, времени и месту рождения — точный расчёт вашей натальной карты.
    </p>
    <a href="https://my.neiro-astro.ru/dashboard" style="display:inline-block;background:#fff;color:#7c3aed;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;">
      Заказать индивидуальный гороскоп
    </a>
  </td></tr>
  </table>

  <p style="margin-top:24px;text-align:center;color:#64748b;font-size:12px;line-height:1.6;">
    Это общий прогноз для знака {$signName}.<br>
    <a href="https://my.neiro-astro.ru/dashboard" style="color:#a78bfa;text-decoration:underline;">
      Построить персональный гороскоп →
    </a>
  </p>
</td></tr>
<tr><td style="padding:24px 32px;text-align:center;background:#0f172a;border-top:1px solid #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td align="center">
        <a href="{$frontendUrl}/login-email" style="color:#a78bfa;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;">
          ⚙️ Управлять подпиской
        </a>
      </td>
      <td align="center">
        <a href="{$unsubUrl}" style="color:#ef4444;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;">
          ❌ Отписаться
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0;color:#475569;font-size:11px;line-height:1.5;">
    AI Астролог · {$frontendUrl}<br>
    Вы получили это письмо, потому что подписаны на ежедневный гороскоп.
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>
HTML;

        $text = "Ваш гороскоп на {$dateRu}\n{$signName}\n\nЗдравствуйте, {$name}!\n{$sectionsText}\n\n"
            . ($blog ? "\n📝 Сегодня в блоге: {$blog->title}\n" . route('blog.show', $blog) . "\n\n" : "")
            . "Заказать индивидуальный гороскоп: {$frontendUrl}/dashboard\n\n"
            . "---\n"
            . "⚙️ Управлять подпиской: {$frontendUrl}/login-email\n"
            . ($unsubUrl ? "❌ Отписаться в один клик: {$unsubUrl}\n" : "");

        return [$html, $text];
    }


    /**
     * Персональный гороскоп — отдельное письмо (эксклюзив)
     */
    public function buildPersonalDigestEmail(
        string $name,
        \App\Models\Horoscope $horoscope
    ): array {
        $frontendUrl = env('APP_FRONTEND_URL', 'https://my.neiro-astro.ru');
        $personalUrl = $frontendUrl . '/horoscope/personal/' . $horoscope->id;
        $dateRu = $horoscope->created_at->locale('ru')->isoFormat('D MMMM YYYY');
        $preview = mb_substr($horoscope->content, 0, 400);
        if (mb_strlen($horoscope->content) > 400) $preview .= '...';
        $fullLength = mb_strlen($horoscope->content);

        // Подписанная ссылка отписки
        $userId = $horoscope->user_id;
        $unsubSig = $userId ? hash_hmac('sha256', (string) $userId, config('app.key')) : '';
        $unsubUrl = $userId ? rtrim($frontendUrl, '/') . "/api/unsubscribe/{$userId}/{$unsubSig}" : '';

        $html = <<<HTML
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;border:2px solid #fbbf24;">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#fbbf24 100%);">
  <div style="font-size:56px;">🎁</div>
  <h1 style="margin:12px 0 0;color:#fff;font-size:28px;font-weight:bold;">Персональный прогноз</h1>
  <p style="margin:8px 0 0;color:#fde68a;font-size:16px;">Только для вас · {$dateRu}</p>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 20px;color:#94a3b8;">Здравствуйте, {$name}!</p>
  <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.7;">
    Этот прогноз составлен специально для вас по вашей натальной карте — дате, времени и месту рождения.
    Он учитывает уникальное расположение планет в момент вашего рождения.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#0f172a;border-radius:12px;border-left:4px solid #fbbf24;">
  <tr><td style="padding:20px;">
    <p style="margin:0;line-height:1.8;color:#e2e8f0;font-size:16px;">
      {$preview}
    </p>
  </td></tr>
  </table>

  <a href="{$personalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1e293b;text-decoration:none;padding:16px 28px;border-radius:12px;font-weight:bold;font-size:16px;margin-bottom:24px;">
    🔮 Читать полный прогноз →
  </a>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:rgba(251,191,36,0.1);border-radius:12px;border:1px solid rgba(251,191,36,0.3);">
  <tr><td style="padding:20px;text-align:center;">
    <div style="color:#fbbf24;font-size:14px;font-weight:bold;margin-bottom:8px;">
      💎 Эксклюзивная возможность
    </div>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;">
      Ваш персональный прогноз обновляется каждое утро.<br>
      Полный текст всегда доступен по кнопке выше.
    </p>
  </td></tr>
  </table>
</td></tr>
<tr><td style="padding:20px 32px;text-align:center;background:#0f172a;border-top:1px solid #1e293b;">
  <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
    Вы получили это письмо, потому что включили функцию «🎁 Бесплатный персональный гороскоп».<br>
    <a href="{$frontendUrl}/dashboard" style="color:#a78bfa;text-decoration:underline;">Управлять настройками</a>
    · <a href="{$unsubUrl}" style="color:#a78bfa;text-decoration:underline;">Отписаться</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>
HTML;

        $text = "Здравствуйте, {$name}!\n\n";
        $text .= "🎁 ПЕРСОНАЛЬНЫЙ ПРОГНОЗ НА {$dateRu}\n\n";
        $text .= "Этот прогноз составлен специально для вас по вашей натальной карте.\n\n";
        $text .= "{$preview}\n\n";
        $text .= "Читать полный прогноз:\n{$personalUrl}\n\n";
        $text .= "—\nAI Астролог · https://my.neiro-astro.ru";

        return [$html, $text];
    }


    public function buildCalendarDigestEmail(
        string $name,
        string $dateRu,
        array $calendars,
        int $userId = 0
    ): array {
        $frontendUrl = env('APP_FRONTEND_URL', 'https://my.neiro-astro.ru');
        $unsubSig = $userId ? hash_hmac('sha256', (string) $userId, config('app.key')) : '';
        $unsubUrl = $userId ? rtrim($frontendUrl, '/') . "/api/unsubscribe/{$userId}/{$unsubSig}" : '';

        $calendarsHtml = '';
        $calendarsText = '';

        foreach ($calendars as $cal) {
            $calName = htmlspecialchars($cal['name'], ENT_XML1);
            $emoji = htmlspecialchars($cal['emoji'], ENT_XML1);
            $calendarsHtml .= '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">'
                . '<tr><td style="padding:20px;background:#1e293b;border-radius:12px;border-left:4px solid #7c3aed;">'
                . '<div style="font-size:20px;font-weight:bold;color:#c4b5fd;margin-bottom:12px;">' . $emoji . ' ' . $calName . '</div>';

            foreach ($cal['blocks'] as $block) {
                $h = htmlspecialchars($block['h'], ENT_XML1);
                $t = nl2br(htmlspecialchars($block['t'], ENT_XML1));
                $calendarsHtml .= '<div style="margin-bottom:16px;">'
                    . '<div style="font-size:14px;font-weight:bold;color:#a78bfa;margin-bottom:6px;">' . $h . '</div>'
                    . '<div style="color:#cbd5e1;line-height:1.6;font-size:14px;">' . $t . '</div>'
                    . '</div>';
                $calendarsText .= "\n{$block['h']}\n{$block['t']}\n";
            }
            $calendarsHtml .= "</td></tr></table>";
            $calendarsText .= "\n";
        }

        $nameSafe = htmlspecialchars($name, ENT_XML1);
        $dateRuSafe = htmlspecialchars($dateRu, ENT_XML1);

        $html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;">'
            . '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">'
            . '<tr><td align="center">'
            . '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">'
            . '<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#4c1d95,#312e81);">'
            . '<div style="font-size:48px;">📅</div>'
            . '<h1 style="margin:8px 0 0;color:#fff;font-size:24px;">Ваши календари на ' . $dateRuSafe . '</h1>'
            . '</td></tr>'
            . '<tr><td style="padding:32px;">'
            . '<p style="margin:0 0 20px;color:#94a3b8;">Здравствуйте, ' . $nameSafe . '!</p>'
            . $calendarsHtml
            . '<p style="margin-top:24px;text-align:center;">'
            . '<a href="' . $frontendUrl . '/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">'
            . 'Настроить календари →</a></p>'
            . '</td></tr></table></td></tr></table>';

        if ($unsubUrl) {
            $html .= '<p style="text-align:center;color:#64748b;font-size:11px;margin-top:16px;"><a href="' . $unsubUrl . '" style="color:#64748b;">Отписаться от рассылки</a></p>';
        }
        $html .= '</body></html>';

        $text = "Здравствуйте, {$name}!\n\nВаши календари на {$dateRu}\n{$calendarsText}\n\nНастроить: {$frontendUrl}/dashboard";

        return [$html, $text];
    }

}
