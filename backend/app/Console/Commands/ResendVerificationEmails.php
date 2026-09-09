<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\EmailVerificationService;
use Illuminate\Console\Command;

class ResendVerificationEmails extends Command
{
    protected $signature = 'emails:resend-verification';
    protected $description = 'Повторно отправляет письмо подтверждения тем, кто не подтвердил email за 24 часа';

    public function handle(EmailVerificationService $service): int
    {
        $users = User::whereNull('email_verified_at')
            ->where('created_at', '>', now()->subDays(3)) // не спамим старых (3 дня вместо 7)
            ->where('email_opt_in', true)
            ->where(function ($q) {
                $q->whereNull('email_verification_sent_at')
                  ->orWhere('email_verification_sent_at', '<', now()->subHours(24)); // не чаще раза в сутки
            })
            ->limit(50) // защита от массовой отправки
            ->get();

        $sent = 0;
        foreach ($users as $user) {
            if ($service->sendVerification($user)) {
                $user->update(['email_verification_sent_at' => now()]);
                $sent++;
                $this->info("✓ {$user->email}");
            } else {
                $this->error("✗ {$user->email}");
            }
        }

        $this->newLine();
        $this->info("Отправлено повторов: {$sent} из {$users->count()}");

        return self::SUCCESS;
    }
}
