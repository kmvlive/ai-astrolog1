<?php

namespace App\Console\Commands;

use App\Models\DailyHoroscope;
use App\Services\AiService;
use Illuminate\Console\Command;

class GenerateDailyHoroscopes extends Command
{
    protected $signature = 'horoscope:generate-daily {--date= : Дата в формате Y-m-d}';
    protected $description = 'Генерирует гороскопы для всех 12 знаков по 5 типам';

    private array $zodiacSigns = [
        'Ari' => 'Овен', 'Tau' => 'Телец', 'Gem' => 'Близнецы',
        'Can' => 'Рак', 'Leo' => 'Лев', 'Vir' => 'Дева',
        'Lib' => 'Весы', 'Sco' => 'Скорпион', 'Sag' => 'Стрелец',
        'Cap' => 'Козерог', 'Aqu' => 'Водолей', 'Pis' => 'Рыбы',
    ];

    private array $types = ['general', 'love', 'career', 'financial', 'health'];

    public function handle(): int
    {
        $date = $this->option('date')
            ? \Carbon\Carbon::parse($this->option('date'))->startOfDay()
            : now()->startOfDay();

        $this->info("Генерирую гороскопы на {$date->format('d.m.Y')} (12 знаков x 5 типов)...");

        $aiService = app(AiService::class);
        $created = 0;
        $skipped = 0;

        foreach ($this->zodiacSigns as $sign => $signRu) {
            foreach ($this->types as $type) {
                $exists = DailyHoroscope::where('date', $date)
                    ->where('zodiac_sign', $sign)
                    ->where('type', $type)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $content = $aiService->generateDailyHoroscope($sign, $signRu, $date, $type);

                if (!$content) {
                    $this->error("  {$signRu} / {$type}: ошибка");
                    continue;
                }

                DailyHoroscope::create([
                    'date' => $date,
                    'zodiac_sign' => $sign,
                    'type' => $type,
                    'content' => $content,
                ]);

                $created++;
                $this->line("  {$signRu} / {$type}: готово");
                sleep(1);
            }
        }

        $this->info("Готово! Создано: {$created}, пропущено (уже было): {$skipped}");
        return 0;
    }
}
