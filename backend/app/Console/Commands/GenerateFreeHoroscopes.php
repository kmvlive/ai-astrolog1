<?php

namespace App\Console\Commands;

use App\Models\FreeDailyHoroscope;
use App\Services\AiService;
use App\Services\FreeHoroscopeService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateFreeHoroscopes extends Command
{
    protected $signature = 'horoscope:generate-free {--force : перегенерировать существующие}';
    protected $description = 'Ночная генерация бесплатных гороскопов (5 систем, сегодня+завтра)';

    public function handle(FreeHoroscopeService $free, AiService $ai): int
    {
        $dates = [now()->startOfDay(), now()->addDay()->startOfDay()];
        $systems = $free->systems();
        $total = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($systems as $slug => $sys) {
            $this->info("→ {$sys['name']} ({$sys['emoji']})");
            foreach ($dates as $date) {
                foreach ($sys['signs'] as $signSlug => [$signName, $signEmoji]) {
                    $exists = FreeDailyHoroscope::where('system', $slug)
                        ->where('sign', $signSlug)
                        ->where('date', $date->toDateString())
                        ->exists();

                    if ($exists && !$this->option('force')) {
                        $skipped++;
                        continue;
                    }

                    $content = $ai->generateFreeHoroscope($slug, $signSlug, $signName, $date);
                    if (!$content) {
                        $failed++;
                        $this->error("  ✗ {$signName} на {$date->format('d.m')}");
                        continue;
                    }

                    FreeDailyHoroscope::updateOrCreate(
                        ['system' => $slug, 'sign' => $signSlug, 'date' => $date->toDateString()],
                        ['content' => $content]
                    );
                    $total++;
                    $this->info("  ✓ {$signName} на {$date->format('d.m')}");
                    usleep(300000); // 0.3s между запросами
                }
            }
        }

        $this->newLine();
        $this->info("Сгенерировано: {$total}, пропущено (есть): {$skipped}, ошибок: {$failed}");
        return self::SUCCESS;
    }
}
