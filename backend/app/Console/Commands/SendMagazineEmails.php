<?php

namespace App\Console\Commands;

use App\Mail\MagazineReadyMail;
use App\Models\MagazineIssue;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendMagazineEmails extends Command
{
    protected $signature = 'magazine:send';
    protected $description = 'Send emails for unsent magazine issues';

    public function handle(): int
    {
        $issues = MagazineIssue::whereNull('sent_at')
            ->with('user')
            ->get();

        $this->info("Sending {$issues->count()} magazine emails");

        $sent = 0;
        $failed = 0;

        foreach ($issues as $issue) {
            if (!$issue->user || !$issue->user->email) continue;

            try {
                Mail::to($issue->user->email)->send(new MagazineReadyMail($issue));
                $issue->update(['sent_at' => now()]);
                $this->line("  ✓ {$issue->user->email}");
                $sent++;
            } catch (\Throwable $e) {
                $this->error("  ✗ {$issue->user->email}: " . $e->getMessage());
                $failed++;
            }
        }

        $this->info("Sent: {$sent}, Failed: {$failed}");
        return 0;
    }
}
