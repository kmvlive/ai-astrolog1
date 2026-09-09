<?php

namespace App\Console\Commands;

use App\Models\DailyHoroscope;
use App\Services\AiService;
use Illuminate\Console\Command;

class GenerateAllHoroscopesCommand extends Command
{
    protected $signature = 'horoscope:generate-all {--period=all : today|tomorrow|week|month|year|all} {--sign= : код знака или all}';
    protected $description = 'Генерирует гороскопы всех знаков, типов и периодов заранее (в фоне)';

    private const SIGNS = [
        'oven' => ['code' => 'Ari', 'name' => 'Овен'],
        'telec' => ['code' => 'Tau', 'name' => 'Телец'],
        'bliznecy' => ['code' => 'Gem', 'name' => 'Близнецы'],
        'rak' => ['code' => 'Can', 'name' => 'Рак'],
        'lev' => ['code' => 'Leo', 'name' => 'Лев'],
        'deva' => ['code' => 'Vir', 'name' => 'Дева'],
        'vesy' => ['code' => 'Lib', 'name' => 'Весы'],
        'skorpion' => ['code' => 'Sco', 'name' => 'Скорпион'],
        'strelec' => ['code' => 'Sag', 'name' => 'Стрелец'],
        'kozerog' => ['code' => 'Cap', 'name' => 'Козерог'],
        'vodoley' => ['code' => 'Aqu', 'name' => 'Водолей'],
        'ryby' => ['code' => 'Pis', 'name' => 'Рыбы'],
    ];

    private const TYPES = ['general', 'love', 'career', 'financial', 'health'];

    public function handle(): int
    {
        $periodOpt = $this->option('period');
        $signOpt = $this->option('sign');
        $date = now()->startOfDay();

        $periods = $periodOpt === 'all'
            ? ['today', 'tomorrow', 'week', 'month', 'year']
            : [$periodOpt];

        $generated = 0;
        $skipped = 0;

        foreach (self::SIGNS as $slug => $sign) {
            if ($signOpt !== null && $signOpt !== 'all' && $signOpt !== $sign['code']) {
                continue;
            }

            foreach ($periods as $period) {
                foreach (self::TYPES as $type) {
                    if ($this->combinationExists($period, $sign['code'], $type, $date)) {
                        $skipped++;
                        continue;
                    }

                    $content = app(AiService::class)->generateDailyHoroscope(
                        $sign['code'], $sign['name'], $date, $type, $period
                    );

                    if ($content) {
                        DailyHoroscope::create([
                            'date' => $date,
                            'zodiac_sign' => $sign['code'],
                            'type' => $type,
                            'period' => $period,
                            'content' => $content,
                        ]);
                        $generated++;
                        $this->info("  ✓ {$sign['name']} / {$type} / {$period}");
                    } else {
                        $this->warn("  ✗ {$sign['name']} / {$type} / {$period} — ошибка AI");
                    }

                    usleep(300000); // пауза 0.3с чтобы не превысить лимит API
                }
            }
        }

        $this->info("Готово! Сгенерировано: {$generated}, пропущено (уже есть): {$skipped}");
        return 0;
    }

    /**
     * Проверяет, есть ли актуальная запись для комбинации sign+type+period
     */
    private function combinationExists(string $period, string $signCode, string $type, $date): bool
    {
        $q = DailyHoroscope::where('zodiac_sign', $signCode)
            ->where('type', $type)
            ->where('period', $period);

        // Для week/month/year ищем запись за текущий период (любого дня внутри периода)
        // Для today/tomorrow — на конкретную дату
        return match ($period) {
            'week' => $q->where('date', '>=', now()->startOfWeek())->exists(),
            'month' => $q->where('date', '>=', now()->startOfMonth())->exists(),
            'year' => $q->where('date', '>=', now()->startOfYear())->exists(),
            default => $q->where('date', $date)->exists(),
        };
    }
}
