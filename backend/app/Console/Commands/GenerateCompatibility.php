<?php

namespace App\Console\Commands;

use App\Models\CompatibilityCache;
use App\Services\AiService;
use Illuminate\Console\Command;

class GenerateCompatibility extends Command
{
    protected $signature = 'horoscope:generate-compatibility {--force}';
    protected $description = 'Генерация совместимости 12×12=78 пар знаков зодиака';

    private array $signs = [
        'Ari' => 'Овен', 'Tau' => 'Телец', 'Gem' => 'Близнецы',
        'Can' => 'Рак', 'Leo' => 'Лев', 'Vir' => 'Дева',
        'Lib' => 'Весы', 'Sco' => 'Скорпион', 'Sag' => 'Стрелец',
        'Cap' => 'Козерог', 'Aqu' => 'Водолей', 'Pis' => 'Рыбы',
    ];

    public function handle(AiService $ai): int
    {
        $keys = array_keys($this->signs);
        $total = 0; $skipped = 0;

        for ($i = 0; $i < count($keys); $i++) {
            for ($j = $i; $j < count($keys); $j++) {
                $a = $keys[$i]; $b = $keys[$j];
                if ($a > $b) [$a, $b] = [$b, $a];

                if (CompatibilityCache::where('sign1', $a)->where('sign2', $b)->exists() && !$this->option('force')) {
                    $skipped++;
                    continue;
                }

                $name1 = $this->signs[$a];
                $name2 = $this->signs[$b];
                $content = $ai->generateCompatibility($name1, $name2);
                if (!$content) continue;

                CompatibilityCache::updateOrCreate(
                    ['sign1' => $a, 'sign2' => $b],
                    ['content' => $content]
                );
                $total++;
                $this->info("✓ {$name1} × {$name2}");
                usleep(500000);
            }
        }

        $this->info("Сгенерировано: {$total}, пропущено: {$skipped}");
        return self::SUCCESS;
    }
}
