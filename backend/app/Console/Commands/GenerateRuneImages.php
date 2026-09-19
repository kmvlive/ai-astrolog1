<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class GenerateRuneImages extends Command
{
    protected $signature = 'runes:generate {--skip-bg : Пропустить генерацию фонов}';
    protected $description = 'Генерирует 24 руны Старшего Футарка с AI-фонами и точными глифами';

    // Элементы → цветовые акценты фона
    private const ELEMENT_PROMPTS = [
        'fire'   => 'warm amber and crimson flames, ember glow',
        'ice'    => 'cold cyan crystal ice shards, frost particles',
        'storm'  => 'electric violet lightning, storm clouds',
        'water'  => 'deep ocean blue ripples, liquid flow',
        'earth'  => 'ancient forest green, moss and stone',
        'air'    => 'silver wind swirls, celestial mist',
    ];

    // 24 руны Старшего Футарка с координатами линий (нормализованные 0-1)
    // y=0 сверху, y=1 снизу, x=0 слева, x=1 справа
    private const RUNES = [
        'fehu'     => ['name' => 'Феху',     'glyph' => 'ᚠ', 'element' => 'fire',
                       'lines' => [[0.45,0.15,0.45,0.85],[0.45,0.28,0.72,0.38],[0.45,0.48,0.72,0.58]]],
        'uruz'     => ['name' => 'Уруз',     'glyph' => 'ᚢ', 'element' => 'earth',
                       'lines' => [[0.35,0.15,0.35,0.85],[0.35,0.15,0.65,0.15],[0.65,0.15,0.65,0.60],[0.65,0.60,0.35,0.85]]],
        'thurisaz' => ['name' => 'Турисаз',  'glyph' => 'ᚦ', 'element' => 'storm',
                       'lines' => [[0.35,0.15,0.35,0.85],[0.35,0.30,0.70,0.50],[0.70,0.50,0.35,0.70]]],
        'ansuz'    => ['name' => 'Ансуз',    'glyph' => 'ᚨ', 'element' => 'air',
                       'lines' => [[0.45,0.15,0.45,0.85],[0.45,0.30,0.72,0.20],[0.45,0.50,0.72,0.40]]],
        'raidho'   => ['name' => 'Райдо',    'glyph' => 'ᚱ', 'element' => 'air',
                       'lines' => [[0.35,0.15,0.35,0.85],[0.35,0.15,0.65,0.15],[0.65,0.15,0.65,0.45],[0.65,0.45,0.35,0.45],[0.45,0.45,0.72,0.85]]],
        'kenaz'    => ['name' => 'Кеназ',    'glyph' => 'ᚲ', 'element' => 'fire',
                       'lines' => [[0.65,0.15,0.35,0.50],[0.35,0.50,0.65,0.85]]],
        'gebo'     => ['name' => 'Гебо',     'glyph' => 'ᚷ', 'element' => 'air',
                       'lines' => [[0.25,0.25,0.75,0.75],[0.75,0.25,0.25,0.75]]],
        'wunjo'    => ['name' => 'Вуньо',    'glyph' => 'ᚹ', 'element' => 'air',
                       'lines' => [[0.35,0.15,0.35,0.85],[0.35,0.15,0.70,0.15],[0.70,0.15,0.70,0.45],[0.70,0.45,0.35,0.45]]],
        'hagalaz'  => ['name' => 'Хагалаз',  'glyph' => 'ᚺ', 'element' => 'ice',
                       'lines' => [[0.30,0.15,0.30,0.85],[0.70,0.15,0.70,0.85],[0.30,0.40,0.70,0.60]]],
        'naudiz'   => ['name' => 'Наудиз',   'glyph' => 'ᚾ', 'element' => 'fire',
                       'lines' => [[0.45,0.15,0.45,0.85],[0.25,0.45,0.75,0.55]]],
        'isa'      => ['name' => 'Иса',      'glyph' => 'ᛁ', 'element' => 'ice',
                       'lines' => [[0.50,0.15,0.50,0.85]]],
        'jera'     => ['name' => 'Йера',     'glyph' => 'ᛃ', 'element' => 'earth',
                       'lines' => [[0.50,0.50,0.75,0.35],[0.75,0.35,0.75,0.55],[0.50,0.50,0.25,0.65],[0.25,0.65,0.25,0.45]]],
        'eihwaz'   => ['name' => 'Эйваз',    'glyph' => 'ᛇ', 'element' => 'earth',
                       'lines' => [[0.50,0.15,0.50,0.85],[0.50,0.25,0.72,0.15],[0.50,0.75,0.28,0.85]]],
        'perthro'  => ['name' => 'Перт',     'glyph' => 'ᛈ', 'element' => 'water',
                       'lines' => [[0.35,0.15,0.35,0.85],[0.35,0.15,0.70,0.15],[0.70,0.15,0.70,0.65],[0.70,0.65,0.35,0.65]]],
        'algiz'    => ['name' => 'Альгиз',   'glyph' => 'ᛉ', 'element' => 'earth',
                       'lines' => [[0.50,0.15,0.50,0.85],[0.50,0.45,0.25,0.15],[0.50,0.45,0.75,0.15]]],
        'sowilo'   => ['name' => 'Совило',   'glyph' => 'ᛊ', 'element' => 'fire',
                       'lines' => [[0.30,0.15,0.65,0.45],[0.65,0.45,0.30,0.55],[0.30,0.55,0.65,0.85]]],
        'tiwaz'    => ['name' => 'Тейваз',   'glyph' => 'ᛏ', 'element' => 'air',
                       'lines' => [[0.50,0.25,0.50,0.85],[0.25,0.45,0.50,0.20],[0.50,0.20,0.75,0.45]]],
        'berkano'  => ['name' => 'Беркана',  'glyph' => 'ᛒ', 'element' => 'earth',
                       'lines' => [[0.35,0.15,0.35,0.85],[0.35,0.15,0.65,0.30],[0.65,0.30,0.35,0.50],[0.35,0.50,0.68,0.65],[0.68,0.65,0.35,0.85]]],
        'ehwaz'    => ['name' => 'Эваз',     'glyph' => 'ᛖ', 'element' => 'earth',
                       'lines' => [[0.28,0.15,0.28,0.85],[0.72,0.15,0.72,0.85],[0.28,0.40,0.72,0.60]]],
        'mannaz'   => ['name' => 'Манназ',   'glyph' => 'ᛗ', 'element' => 'air',
                       'lines' => [[0.28,0.15,0.28,0.85],[0.72,0.15,0.72,0.85],[0.28,0.15,0.50,0.40],[0.50,0.40,0.72,0.15]]],
        'laguz'    => ['name' => 'Лагуз',    'glyph' => 'ᛚ', 'element' => 'water',
                       'lines' => [[0.45,0.15,0.45,0.85],[0.45,0.20,0.75,0.50]]],
        'ingwaz'   => ['name' => 'Ингуз',    'glyph' => 'ᛜ', 'element' => 'earth',
                       'lines' => [[0.50,0.20,0.75,0.50],[0.75,0.50,0.50,0.80],[0.50,0.80,0.25,0.50],[0.25,0.50,0.50,0.20]]],
        'dagaz'    => ['name' => 'Дагаз',    'glyph' => 'ᛞ', 'element' => 'fire',
                       'lines' => [[0.25,0.20,0.25,0.80],[0.75,0.20,0.75,0.80],[0.25,0.20,0.75,0.80],[0.25,0.80,0.75,0.20]]],
        'othala'   => ['name' => 'Отала',    'glyph' => 'ᛟ', 'element' => 'earth',
                       'lines' => [[0.50,0.15,0.72,0.42],[0.72,0.42,0.50,0.70],[0.50,0.70,0.28,0.42],[0.28,0.42,0.50,0.15],[0.28,0.55,0.28,0.85],[0.72,0.55,0.72,0.85]]],
    ];

    public function handle()
    {
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', 0);

        $disk = Storage::disk('public');
        $disk->makeDirectory('runes');

        $skipBg = (bool) $this->option('skip-bg');
        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');

        $bar = $this->output->createProgressBar(24);
        $bar->start();

        $generated = 0;
        $failed = 0;

        foreach (self::RUNES as $slug => $rune) {
            $bar->advance();
            $path = "runes/{$slug}.png";

            // 1) Генерация фона (пропуск если уже есть и skip-bg)
            $bgPath = "runes/{$slug}-bg.png";
            $haveBg = $disk->exists($bgPath);
            if (!$haveBg && !$skipBg) {
                $elementDesc = self::ELEMENT_PROMPTS[$rune['element']] ?? '';
                $prompt = "Mystical rune stone background, unified deck style: deep indigo-violet night sky filled with golden stars and soft purple nebulae. Ornate Art Nouveau golden frame with crescent moons, suns and star ornaments on a deep indigo border. Center: an empty smooth dark slate medallion with subtle golden rim (no symbols, no text). Atmosphere: {$elementDesc}. Painterly detailed illustration, rich colors, no text anywhere, no watermark, masterpiece quality.";

                try {
                    $resp = Http::timeout(90)
                        ->withHeaders(['Authorization' => "Bearer {$apiKey}", 'Content-Type' => 'application/json'])
                        ->post("{$baseUrl}/images/generations", [
                            'model' => 'black_forest_labs/flux-2-klein-9b',
                            'prompt' => $prompt,
                            'size' => '1024x1024',
                            'n' => 1,
                        ]);

                    if ($resp->successful()) {
                        $data = $resp->json();
                        $img = $data['data'][0] ?? null;
                        if ($img && !empty($img['url'])) {
                            $dl = Http::timeout(30)->get($img['url']);
                            if ($dl->successful() && strlen($dl->body()) > 30000) {
                                $disk->put($bgPath, $dl->body());
                                $haveBg = true;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Rune bg failed for {$slug}", ['error' => $e->getMessage()]);
                }
                usleep(500000);
            }

            // 2) Рисуем глиф поверх фона
            if ($haveBg || $disk->exists($path)) {
                $bgData = $haveBg ? $disk->get($bgPath) : $disk->get($path);
                $final = $this->drawRuneGlyph($bgData, $rune['lines']);
                if ($final) {
                    $disk->put($path, $final);
                    $generated++;
                } else {
                    $failed++;
                }
            } else {
                $failed++;
            }

            unset($bgData, $final);
            if (function_exists('gc_collect_cycles')) gc_collect_cycles();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Сгенерировано: {$generated}, ошибок: {$failed}");
        return 0;
    }

    /**
     * Рисует золотой глиф руны поверх фона с glow-эффектом
     */
    private function drawRuneGlyph(string $imageData, array $lines): ?string
    {
        $img = @imagecreatefromstring($imageData);
        if (!$img) return null;

        $w = imagesx($img);
        $h = imagesy($img);

        // Центральная область для глифа (80% высоты, 60% ширины, центр)
        $glyphH = (int)($h * 0.55);
        $glyphW = (int)($glyphH * 0.6);
        $ox = (int)(($w - $glyphW) / 2);
        $oy = (int)(($h - $glyphH) / 2) - (int)($h * 0.04);

        // Цвета
        $glowOuter = imagecolorallocatealpha($img, 255, 200, 80, 90);  // тёплое свечение
        $glowInner = imagecolorallocatealpha($img, 255, 230, 140, 60); // яркое свечение
        $goldMain  = imagecolorallocate($img, 240, 200, 90);           // основное золото
        $goldBright = imagecolorallocate($img, 255, 245, 180);         // блик

        imagesetthickness($img, 1);

        foreach ($lines as $line) {
            $x1 = (int)($ox + $line[0] * $glyphW);
            $y1 = (int)($oy + $line[1] * $glyphH);
            $x2 = (int)($ox + $line[2] * $glyphW);
            $y2 = (int)($oy + $line[3] * $glyphH);

            // Glow слои (от самого широкого к узкому)
            for ($r = 14; $r >= 8; $r -= 2) {
                imagesetthickness($img, $r);
                imageline($img, $x1, $y1, $x2, $y2, $glowOuter);
            }
            for ($r = 7; $r >= 4; $r -= 1) {
                imagesetthickness($img, $r);
                imageline($img, $x1, $y1, $x2, $y2, $glowInner);
            }
            // Основная золотая линия
            imagesetthickness($img, 6);
            imageline($img, $x1, $y1, $x2, $y2, $goldMain);
            // Светлый блик сверху-слева
            imagesetthickness($img, 2);
            imageline($img, $x1 - 1, $y1 - 1, $x2 - 1, $y2 - 1, $goldBright);
        }

        imagesetthickness($img, 1);

        ob_start();
        imagepng($img, null, 6);
        $out = ob_get_clean();
        imagedestroy($img);

        return $out && strlen($out) > 10000 ? $out : null;
    }
}
