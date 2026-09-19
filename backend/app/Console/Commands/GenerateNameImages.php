<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\NameMeaning;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class GenerateNameImages extends Command
{
    protected $signature = 'names:generate-images {--limit=0 : Количество имён (0 = все без картинок)} {--batch-size=5 : Размер батча}';
    protected $description = 'Генерирует иллюстрации для имён через Timeweb AI';

    public function handle()
    {
        $limit = (int) $this->option('limit');
        $batchSize = (int) $this->option('batch-size');

        // Загружаю словарь символов
        $symbolsFile = '/tmp/name-symbols.json';
        if (!file_exists($symbolsFile)) {
            $this->error('Словарь символов не найден: ' . $symbolsFile);
            return 1;
        }
        $symbols = json_decode(file_get_contents($symbolsFile), true);
        $this->info("Загружено символов: " . count($symbols));

        // Получаю имена без картинок
        $query = NameMeaning::whereNull('image')->orWhere('image', '');
        if ($limit > 0) {
            $query->limit($limit);
        }
        $names = $query->get();

        if ($names->isEmpty()) {
            $this->info('Все имена уже имеют иллюстрации.');
            return 0;
        }

        $this->info("Имён для генерации: {$names->count()}");

        $disk = Storage::disk('public');
        $disk->makeDirectory('names');

        $baseUrl = rtrim(env('TIMEWEB_AI_BASE_URL', 'https://api.timeweb.ai/v1'), '/');
        $apiKey = env('TIMEWEB_AI_API_KEY');

        if (!$apiKey) {
            $this->error('TIMEWEB_AI_API_KEY не задан');
            return 1;
        }

        $bar = $this->output->createProgressBar($names->count());
        $bar->start();

        $generated = 0;
        $failed = 0;

        foreach ($names as $name) {
            $bar->advance();

            $symbol = $symbols[$name->translit] ?? null;
            if (!$symbol) {
                Log::warning("Символ не найден для имени: {$name->name}");
                $failed++;
                continue;
            }

            // Строю промпт в стиле колоды Таро
            $prompt = $this->buildPrompt($name->name, $symbol);

            // Генерирую через Timeweb API
            $imageData = $this->generateViaTimeweb($baseUrl, $apiKey, $prompt);

            if ($imageData && strlen($imageData) > 30000) {
                $filename = "names/{$name->translit}.png";
                $disk->put($filename, $imageData);
                
                $name->image = $filename;
                $name->save();
                
                $generated++;
            } else {
                $failed++;
                Log::error("Не удалось сгенерировать картинку для: {$name->name}");
            }

            // Пауза между запросами
            sleep(3);
        }

        $bar->finish();
        $this->newLine();
        $this->info("Сгенерировано: {$generated}, ошибок: {$failed}");

        return 0;
    }

    private function buildPrompt(string $name, string $symbol): string
    {
        return <<<PROMPT
Mystical name talisman illustration, unified deck style: the symbol is centered in the image, surrounded by deep indigo-violet night sky filled with golden stars and soft purple nebulae. The illustration has an ornate Art Nouveau golden frame with crescent moons, suns and star ornaments on a deep indigo border. Name "{$name}" in gold capital letters on an indigo banner at the bottom. Central symbol: {$symbol}. Painterly detailed illustration, rich colors, esoteric symbolism, no watermark, no text except name banner, masterpiece quality.
PROMPT;
    }

    private function generateViaTimeweb(string $baseUrl, string $apiKey, string $prompt): ?string
    {
        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/images/generations", [
                    'model' => 'black_forest_labs/flux-2-klein-9b',
                    'prompt' => $prompt,
                    'size' => '1024x1024',
                    'n' => 1,
                ]);

            if ($response->status() !== 200) {
                Log::warning('Timeweb error', ['status' => $response->status()]);
                return null;
            }

            $data = $response->json();
            $img = $data['data'][0] ?? null;
            if (!$img || empty($img['url'])) {
                return null;
            }

            $download = Http::timeout(30)->get($img['url']);
            if ($download->successful() && strlen($download->body()) > 30000) {
                return $this->convertToPng($download->body());
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Timeweb exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function convertToPng(string $imageData): string
    {
        $img = @imagecreatefromstring($imageData);
        if (!$img) {
            return $imageData;
        }

        // Ресайз до 800x800 для оптимизации
        $width = 800;
        $height = 800;
        $resized = imagecreatetruecolor($width, $height);
        imagecopyresampled($resized, $img, 0, 0, 0, 0, $width, $height, imagesx($img), imagesy($img));

        ob_start();
        imagepng($resized, null, 9);
        $result = ob_get_clean();

        imagedestroy($img);
        imagedestroy($resized);

        return $result ?: $imageData;
    }
}
