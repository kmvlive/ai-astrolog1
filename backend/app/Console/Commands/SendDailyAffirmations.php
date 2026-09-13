<?php

namespace App\Console\Commands;

use App\Models\Affirmation;
use App\Models\MaxSubscriber;
use App\Services\UniSenderService;
use Illuminate\Console\Command;

class SendDailyAffirmations extends Command
{
    protected $signature = 'affirmation:send-daily';
    protected $description = 'Рассылает ежедневную аффирмацию подписчикам';

    public function handle(): int
    {
        $today = now()->startOfDay();
        $affirmation = Affirmation::forDate($today)->first();
        
        if (!$affirmation) {
            $this->error('Нет аффирмации на сегодня');
            return 1;
        }

        $subscribers = MaxSubscriber::where('is_active', true)->get();
        $this->info("Подписчиков: {$subscribers->count()}");

        $service = app(UniSenderService::class);
        
        foreach ($subscribers as $sub) {
            $html = view('emails.affirmation', [
                'title' => $affirmation->title,
                'description' => $affirmation->description,
                'date' => $affirmation->date->format('d.m.Y'),
            ])->render();

            $service->sendEmail($sub->email, "💫 {$affirmation->title}", $html);
            $this->line("Отправлено: {$sub->email}");
        }

        $this->info('✓ Рассылка завершена');
        return 0;
    }
}
