<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class GenerateRuneThumbnails extends Command
{
    protected $signature = 'runes:thumbnails';
    protected $description = 'Генерирует оптимизированные JPEG-версии рун: thumb (300w) и med (640w)';

    public function handle()
    {
        ini_set('memory_limit', '512M');
        $disk = Storage::disk('public');
        $runes = \App\Support\Runes::all();

        $sizes = ['thumb' => 300, 'med' => 640];

        $bar = $this->output->createProgressBar(count($runes));
        $bar->start();

        $generated = 0;
        foreach ($runes as $slug => $rune) {
            $bar->advance();
            $sourcePath = "runes/{$slug}.webp";
            if (!$disk->exists($sourcePath)) continue;

            $img = @imagecreatefromstring($disk->get($sourcePath));
            if (!$img) continue;
            $srcW = imagesx($img);
            $srcH = imagesy($img);

            foreach ($sizes as $prefix => $width) {
                $height = (int) round($width * 10 / 7);
                $thumbRatio = $width / $height;

                if ($srcW / $srcH > $thumbRatio) {
                    $cropW = (int)($srcH * $thumbRatio);
                    $cropH = $srcH;
                    $srcX = (int)(($srcW - $cropW) / 2);
                    $srcY = 0;
                } else {
                    $cropW = $srcW;
                    $cropH = (int)($srcW / $thumbRatio);
                    $srcX = 0;
                    $srcY = (int)(($srcH - $cropH) / 2);
                }

                $out = imagecreatetruecolor($width, $height);
                imagecopyresampled($out, $img, 0, 0, $srcX, $srcY, $width, $height, $cropW, $cropH);

                ob_start();
                imagejpeg($out, null, 82);
                $data = ob_get_clean();
                imagedestroy($out);

                if ($data && strlen($data) > 1000) {
                    $disk->put("runes/{$prefix}-{$slug}.webp", $data);
                    $generated++;
                }
            }

            // Удаляю старые PNG-миниатюры
            foreach (['thumb', 'med'] as $prefix) {
                $old = "runes/{$prefix}-{$slug}.webp";
                if ($disk->exists($old)) $disk->delete($old);
            }

            imagedestroy($img);
        }

        $bar->finish();
        $this->newLine();
        $this->info("Сгенерировано файлов: {$generated}");

        foreach (['thumb-*.jpg', 'med-*.jpg'] as $pattern) {
            $total = 0;
            foreach ($disk->files('runes') as $f) {
                if (fnmatch($pattern, basename($f))) $total += $disk->size($f);
            }
            $this->info("{$pattern}: " . round($total / 1024 / 1024, 2) . " MB");
        }
        return 0;
    }
}
