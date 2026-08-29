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

    public function buildHoroscopeEmail(string $name, string $signName, string $signEmoji, string $content, string $dateRu): array
    {
        $paragraphs = implode('', array_map(
            fn($p) => '<p style="margin:0 0 16px;line-height:1.7;color:#e2e8f0;">' . htmlspecialchars(trim($p)) . '</p>',
            preg_split('/\n\n+/', $content)
        ));

        $html = <<<HTML
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#4c1d95,#312e81);">
  <div style="font-size:48px;">{$signEmoji}</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:24px;">Гороскоп для {$signName}</h1>
  <p style="margin:4px 0 0;color:#c4b5fd;">{$dateRu}</p>
</td></tr>
<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;color:#94a3b8;">Здравствуйте, {$name}!</p>
  {$paragraphs}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr><td align="center">
    <a href="https://my.neiro-astro.ru/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;">
      Получить персональный гороскоп
    </a>
  </td></tr>
  </table>
  <p style="margin-top:16px;text-align:center;color:#64748b;font-size:13px;">
    Общий прогноз учитывает только знак зодиака.<br>Персональный строится на вашей натальной карте — точно и индивидуально.
  </p>
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

        $text = "Гороскоп для {$signName} на {$dateRu}\n\n{$name}, здравствуйте!\n\n{$content}\n\n"
            . "Получить персональный гороскоп: https://my.neiro-astro.ru/dashboard";

        return [$html, $text];
    }
}
