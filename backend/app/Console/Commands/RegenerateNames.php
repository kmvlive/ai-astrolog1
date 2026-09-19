<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\NameMeaning;
use App\Services\AiService;

class RegenerateNames extends Command
{
    protected $signature = 'names:regenerate {--limit=0 : Количество записей (0 = все)} {--dry-run : Только показать, что будет сделано}';
    protected $description = 'Регенерировать толкования имён с новым промптом (без упоминаний личностей)';

    public function handle()
    {
        $limit = (int) $this->option('limit');
        $dryRun = $this->option('dry-run');

        $query = NameMeaning::where('ai_generated', true)->where('approved', true);
        if ($limit > 0) {
            $query->limit($limit);
        }
        $names = $query->get();

        if ($names->isEmpty()) {
            $this->info('Нет записей для перегенерации.');
            return 0;
        }

        $this->info("Найдено записей: {$names->count()}");

        if ($dryRun) {
            $this->info('DRY RUN — изменения не применяются');
            $this->table(
                ['ID', 'Имя', 'Длина текста'],
                $names->map(fn($n) => [$n->id, $n->name, mb_strlen($n->interpretation)])
            );
            return 0;
        }

        $ai = app(AiService::class);
        $bar = $this->output->createProgressBar($names->count());
        $bar->start();

        $regenerated = 0;
        $failed = 0;

        foreach ($names as $name) {
            $bar->advance();

            // Бэкап старого текста в лог
            \Log::info("Name regen backup", [
                'id' => $name->id,
                'name' => $name->name,
                'old_text' => $name->interpretation,
            ]);

            // Генерируем новое толкование
            $newText = $ai->generateNameMeaning($name->name);
            
            if ($newText && mb_strlen($newText) > 100) {
                $name->interpretation = $newText;
                $name->save();
                $regenerated++;
            } else {
                $failed++;
            }

            // Пауза 2 сек между запросами
            sleep(2);
        }

        $bar->finish();
        $this->newLine();
        $this->info("✓ Успешно: {$regenerated}");
        if ($failed > 0) {
            $this->warn("✗ Ошибок: {$failed}");
        }

        return 0;
    }
}
