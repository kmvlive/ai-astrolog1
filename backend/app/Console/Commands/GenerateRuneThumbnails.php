<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class GenerateRuneThumbnails extends Command
{
    protected $signature = 'runes:thumbnails {--width=300 : Ширина миниатюры}';
    protected $description = 'Генерирует оптимизированные миниатюры для каталога рун';

    public function handle()
    {
        ini_set('memory_limit', '512M');
        $width = (int) $this->option('width');
        $height = (int) round($width * 10 / 7); // сохраняем пропорции 7:10

        $disk = Storage::disk('public');
        $runes = \App\Support\Runes::all();

        $bar = $this->output->createProgressBar(count($runes));
        $bar->start();

        $generated = 0;
        foreach ($runes as $slug => $rune) {
            $bar->advance();
            $sourcePath = "runes/{$slug}.png";
            $thumbPath = "runes/thumb-{$slug}.png";

            if (!$disk->exists($sourcePath)) continue;

            $data = $disk->get($sourcePath);
            $img = @imagecreatefromstring($data);
            if (!$img) continue;

            $srcW = imagesx($img);
            $srcH = imagesy($img);

            // Создаём thumbnail с object-cover (обрезка по центру)
            $thumb = imagecreatetruecolor($width, $height);
            
            // Рассчитываем область обрезки
            $srcRatio = $srcW / $srcH;
            $thumbRatio = $width / $height;

            if ($srcRatio > $thumbRatio) {
                // Исходное шире — обрезаем бока
                $newW = (int)($srcH * $thumbRatio);
                $srcX = (int)(($srcW - $newW) / 2);
                $srcY = 0;
                $cropW = $newW;
                $cropH = $srcH;
            } else {
                // Исходное выше — обрезаем верх/низ
                $newH = (int)($srcW / $thumbRatio);
                $srcX = 0;
                $srcY = (int)(($srcH - $newH) / 2);
                $cropW = $srcW;
                $cropH = $newH;
            }

            imagecopyresampled(
                $thumb, $img,
                0, 0,
                $srcX, $srcY,
                $width, $height,
                $cropW, $cropH
            );

            ob_start();
            imagepng($thumb, null, 7); // компрессия 7 (баланс размер/качество)
            $thumbData = ob_get_clean();

            imagedestroy($img);
            imagedestroy($thumb);

            if ($thumbData && strlen($thumbData) > 1000) {
                $disk->put($thumbPath, $thumbData);
                $generated++;
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info("Сгенерировано миниатюр: {$generated}");

        // Статистика размеров
        $totalFull = 0;
        $totalThumb = 0;
        foreach ($runes as $slug => $rune) {
            $full = $disk->size("runes/{$slug}.png");
            $thumb = $disk->exists("runes/thumb-{$slug}.png") ? $disk->size("runes/thumb-{$slug}.png") : 0;
            $totalFull += $full;
            $totalThumb += $thumb;
        }
        $this->info("Полные картинки: " . round($totalFull / 1024 / 1024, 2) . " MB");
        $this->info("Миниатюры: " . round($totalThumb / 1024 / 1024, 2) . " MB");
        $this->info("Экономия: " . round((1 - $totalThumb / $totalFull) * 100) . "%");

        return 0;
    }
}
