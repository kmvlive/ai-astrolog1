<?php

namespace App\Console\Commands;

use App\Models\DailyHoroscope;
use App\Services\AiService;
use Illuminate\Console\Command;

class GenerateDailyHoroscopes extends Command
{
    protected $signature = 'horoscope:generate-daily 
        {--date= : Дата в формате Y-m-d} 
        {--period=today : Период: today, tomorrow, week, month, year}
        {--type= : Конкретный тип: general, love, career, financial, health (все по умолчанию)}';
    
    protected $description = 'Генерирует гороскопы для 12 знаков';

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
        
        $period = $this->option('period');
        $specificType = $this->option('type');
        $typesToGenerate = $specificType ? [$specificType] : $this->types;

        $this->info("Генерирую гороскопы: {$period} на {$date->format('d.m.Y')} (12 знаков x " . count($typesToGenerate) . " типов)...");

        $aiService = app(AiService::class);
        $created = 0;
        $skipped = 0;

        foreach ($this->zodiacSigns as $sign => $signRu) {
            foreach ($typesToGenerate as $type) {
                $exists = DailyHoroscope::where('date', $date)
                    ->where('zodiac_sign', $sign)
                    ->where('type', $type)
                    ->where('period', $period)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $content = $aiService->generateDailyHoroscope($sign, $signRu, $date, $type, $period);

                if (!$content) {
                    $this->error("  {$signRu} / {$type} / {$period}: ошибка");
                    continue;
                }

                DailyHoroscope::create([
                    'date' => $date,
                    'zodiac_sign' => $sign,
                    'type' => $type,
                    'period' => $period,
                    'content' => $content,
                ]);

                $created++;
                $this->line("  {$signRu} / {$type} / {$period}: готово");
                sleep(1);
            }
        }

        $this->info("Готово! Создано: {$created}, пропущено: {$skipped}");
        return 0;
    }
}
