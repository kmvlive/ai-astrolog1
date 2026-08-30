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
                Log::info('UniSender Go: sent', ['to' => $to, 'job_id' => $data['job_id'] ?? null]);
                return true;
            }

            Log::error('UniSender Go error', [
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
        array $sections
    ): array {
        $sectionsHtml = '';
        $sectionsText = '';

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
<tr><td style="padding:16px 32px;text-align:center;background:#0f172a;">
  <p style="margin:0;color:#475569;font-size:12px;">
    AI Астролог · my.neiro-astro.ru<br>
    <a href="https://my.neiro-astro.ru/dashboard" style="color:#64748b;">Настройки рассылки</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>
HTML;

        $text = "Ваш гороскоп на {$dateRu}\n{$signName}\n\nЗдравствуйте, {$name}!\n{$sectionsText}\n\n"
            . "Заказать индивидуальный гороскоп: https://my.neiro-astro.ru/dashboard";

        return [$html, $text];
    }
}
