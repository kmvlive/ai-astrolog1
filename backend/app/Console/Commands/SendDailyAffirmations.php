<?php

namespace App\Console\Commands;

use App\Models\Affirmation;
use App\Models\User;
use App\Services\UniSenderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SendDailyAffirmations extends Command
{
    protected $signature = 'affirmation:send-daily';
    protected $description = 'Рассылает ежедневную аффирмацию подписчикам';

    public function handle(): int
    {
        $today = now()->startOfDay();
        $affirmation = Affirmation::whereDate('date', $today)->first();

        if (!$affirmation) {
            $this->error('Нет аффирмации на сегодня');
            return 1;
        }

        // Подписчики: пользователи с флагом в Cache
        $subscribers = User::whereNotNull('email')
            ->where('email_opt_in', true)
            ->get()
            ->filter(fn($u) => Cache::get('affirmation_sub_' . $u->id, false));

        $this->info("Подписчиков на аффирмации: {$subscribers->count()}");

        if ($subscribers->isEmpty()) {
            $this->info('Нет подписчиков, рассылка не требуется');
            return 0;
        }

        $service = app(UniSenderService::class);

        foreach ($subscribers as $user) {
            try {
                $html = view('emails.affirmation', [
                    'title' => $affirmation->title,
                    'description' => $affirmation->description,
                    'date' => $affirmation->date->format('d.m.Y'),
                    'userName' => $user->name,
                ])->render();

                $service->sendEmail($user->email, "💫 {$affirmation->title}", $html);
                $this->line("✓ {$user->email}");
            } catch (\Throwable $e) {
                $this->error("✗ {$user->email}: {$e->getMessage()}");
            }
        }

        $this->info('Рассылка завершена');
        return 0;
    }
}
