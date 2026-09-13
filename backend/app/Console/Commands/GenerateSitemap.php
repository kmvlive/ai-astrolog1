<?php

namespace App\Console\Commands;

use App\Models\Affirmation;
use App\Models\BlogPost;
use Illuminate\Console\Command;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';
    protected $description = 'Генерирует sitemap.xml с аффирмациями и блогом';

    public function handle(): int
    {
        $baseUrl = rtrim(config('app.url'), '/');
        $now = now()->toAtomString();
        
        $urls = [];
        
        // Статические страницы
        $staticPages = [
            '/' => ['priority' => '1.0', 'changefreq' => 'daily'],
            '/horoscopes' => ['priority' => '0.9', 'changefreq' => 'daily'],
            '/affirmations' => ['priority' => '0.9', 'changefreq' => 'daily'],
            '/blog' => ['priority' => '0.8', 'changefreq' => 'daily'],
            '/divinations' => ['priority' => '0.7', 'changefreq' => 'weekly'],
            '/pricing' => ['priority' => '0.6', 'changefreq' => 'monthly'],
        ];
        
        foreach ($staticPages as $path => $meta) {
            $urls[] = [
                'loc' => $baseUrl . $path,
                'lastmod' => $now,
                'changefreq' => $meta['changefreq'],
                'priority' => $meta['priority'],
            ];
        }
        
        // Аффирмации (все)
        $affirmations = Affirmation::orderBy('date', 'desc')->get();
        foreach ($affirmations as $aff) {
            $urls[] = [
                'loc' => $baseUrl . '/affirmations/' . $aff->date->format('Y-m-d'),
                'lastmod' => $aff->updated_at->toAtomString(),
                'changefreq' => 'yearly',
                'priority' => '0.7',
            ];
        }
        
        // Блог (опубликованные)
        $posts = BlogPost::published()->orderBy('published_at', 'desc')->get();
        foreach ($posts as $post) {
            $urls[] = [
                'loc' => $baseUrl . '/blog/' . $post->slug,
                'lastmod' => $post->updated_at->toAtomString(),
                'changefreq' => 'monthly',
                'priority' => '0.6',
            ];
        }
        
        // Гороскопы для каждого знака
        $signs = ['oven', 'telec', 'bliznecy', 'rak', 'lev', 'deva', 'vesy', 'skorpion', 'strelec', 'kozerog', 'vodoley', 'ryby'];
        foreach ($signs as $sign) {
            $urls[] = [
                'loc' => $baseUrl . '/horoscopes/' . $sign,
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.8',
            ];
        }
        
        // Генерируем XML
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        foreach ($urls as $url) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars($url['loc']) . "</loc>\n";
            $xml .= "    <lastmod>" . $url['lastmod'] . "</lastmod>\n";
            $xml .= "    <changefreq>" . $url['changefreq'] . "</changefreq>\n";
            $xml .= "    <priority>" . $url['priority'] . "</priority>\n";
            $xml .= "  </url>\n";
        }
        
        $xml .= '</urlset>';
        
        file_put_contents(public_path('sitemap.xml'), $xml);
        
        $this->info("✓ Sitemap сгенерирован: " . count($urls) . " URL");
        $this->info("  - Статических: " . count($staticPages));
        $this->info("  - Аффирмаций: " . $affirmations->count());
        $this->info("  - Блог: " . $posts->count());
        $this->info("  - Гороскопов: " . count($signs));
        
        return 0;
    }
}
