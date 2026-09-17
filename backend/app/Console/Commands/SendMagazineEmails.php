<?php

namespace App\Console\Commands;

use App\Models\MagazineIssue;
use App\Services\UniSenderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\View;

class SendMagazineEmails extends Command
{
    protected $signature = 'magazine:send {--test= : Отправить тестовое письмо на указанный email}';
    protected $description = 'Send magazine emails via UniSender for unsent issues';

    public function handle(): int
    {
        $testEmail = $this->option('test');
        $service = app(UniSenderService::class);

        $query = MagazineIssue::whereNull('sent_at')->with('user');
        
        if ($testEmail) {
            // Тестовая отправка: берём последний выпуск любого пользователя
            $issues = $query->latest('id')->limit(1)->get();
            $this->info("TEST MODE: sending to {$testEmail}");
        } else {
            $issues = $query->get();
        }

        $this->info("Processing {$issues->count()} magazine issues");

        $sent = 0;
        $failed = 0;

        foreach ($issues as $issue) {
            if (!$issue->user) {
                $this->error("  ✗ Issue #{$issue->id}: no user");
                $failed++;
                continue;
            }

            $email = $testEmail ?: $issue->user->email;
            $name = $issue->user->name ?: 'друг';
            $dateRu = $issue->issue_date->locale('ru')->isoFormat('D MMMM YYYY');
            $subject = "💌 Ваш журнал от {$dateRu} готов";

            // Рендерим HTML и текст письма
            try {
                $html = View::make('emails.magazine-ready', compact('issue'))->render();
                $text = $this->buildTextVersion($issue, $name, $dateRu);

                // Отправляем через UniSender
                $success = $service->sendEmail($email, $subject, $html, $text);

                if ($success) {
                    if (!$testEmail) {
                        $issue->update(['sent_at' => now()]);
                    }
                    $this->line("  ✓ {$email}");
                    $sent++;
                } else {
                    $this->error("  ✗ {$email}: UniSender failed");
                    $failed++;
                }
            } catch (\Throwable $e) {
                $this->error("  ✗ {$email}: " . $e->getMessage());
                $failed++;
            }
        }

        $this->info("Sent: {$sent}, Failed: {$failed}");
        return $failed > 0 ? 1 : 0;
    }

    private function buildTextVersion(MagazineIssue $issue, string $name, string $dateRu): string
    {
        $c = $issue->content;
        $url = url('/magazine/' . $issue->uuid);

        $text = "Здравствуйте, {$name}!\n\n";
        $text .= "Ваш персональный журнал от {$dateRu} готов.\n\n";

        if ($c['horoscope'] ?? null) {
            $text .= "⭐ Ваш гороскоп\n";
            $text .= mb_substr($c['horoscope']['content'] ?? '', 0, 200) . "...\n\n";
        }

        if ($c['affirmation'] ?? null) {
            $text .= "💫 Аффирмация дня: {$c['affirmation']['title']}\n\n";
        }

        if ($c['tarot'] ?? null) {
            $text .= "🎴 Карта дня: {$c['tarot']['name']}\n\n";
        }

        if ($c['biorhythms'] ?? null) {
            $b = $c['biorhythms'];
            $text .= "📊 Биоритмы:\n";
            $text .= "  Физический: {$b['physical']}%\n";
            $text .= "  Эмоциональный: {$b['emotional']}%\n";
            $text .= "  Интеллектуальный: {$b['intellectual']}%\n\n";
        }

        $text .= "Откройте полный журнал:\n{$url}\n\n";
        $text .= "—\nAI Астролог · https://my.neiro-astro.ru";

        return $text;
    }
}
