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
            '/divinations/coffee-grounds' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/divinations/celtic-cross' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/divinations/runes' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/divinations/tarot-birthdate' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/divinations/tarot-love' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/divinations/tarot-future' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/divinations/tarot-yes-no' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/pricing' => ['priority' => '0.8', 'changefreq' => 'monthly'],
            '/natal-chart' => ['priority' => '0.8', 'changefreq' => 'monthly'],
            '/calendars' => ['priority' => '0.7', 'changefreq' => 'daily'],
            '/calendars/holidays' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/orthodox' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/muslim' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/lunar' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/gardener' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/haircut' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/names' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/calendars/conception' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/moon' => ['priority' => '0.6', 'changefreq' => 'daily'],
            '/biorhythms' => ['priority' => '0.5', 'changefreq' => 'daily'],
            '/dreams' => ['priority' => '0.7', 'changefreq' => 'weekly'],
            '/names' => ['priority' => '0.6', 'changefreq' => 'monthly'],
            '/tarot' => ['priority' => '0.6', 'changefreq' => 'weekly'],
            '/crystal-ball' => ['priority' => '0.5', 'changefreq' => 'weekly'],
            '/numerology/matrix' => ['priority' => '0.7', 'changefreq' => 'monthly'],
            '/numerology/compatibility' => ['priority' => '0.7', 'changefreq' => 'monthly'],
            '/numerology/arcana' => ['priority' => '0.6', 'changefreq' => 'yearly'],
            '/terms' => ['priority' => '0.3', 'changefreq' => 'yearly'],
            '/register' => ['priority' => '0.5', 'changefreq' => 'monthly'],
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
        
        // Гадания
        $divinationTypes = ['coffee-grounds', 'tarot-future', 'tarot-love', 'tarot-yes-no', 'tarot-birthdate', 'celtic-cross', 'runes'];
        foreach ($divinationTypes as $type) {
            $urls[] = [
                'loc' => $baseUrl . '/divinations/' . $type,
                'lastmod' => $now,
                'changefreq' => 'weekly',
                'priority' => '0.6',
            ];
        }

        // Календари
        $calendarSlugs = ['lunar', 'orthodox', 'garden', 'beauty', 'health', 'business'];
        foreach ($calendarSlugs as $slug) {
            $urls[] = [
                'loc' => $baseUrl . '/calendars/' . $slug,
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.6',
            ];
        }

        // Бесплатные гороскопы по системам
        $freeSystems = ['zoroastrian', 'flowers', 'japanese', 'chinese', 'tibetan', 'celtic', 'egyptian', 'indian', 'mayan', 'runes', 'numerology', 'karmic'];
        foreach ($freeSystems as $system) {
            $urls[] = [
                'loc' => $baseUrl . '/horoscopes/free/' . $system,
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.7',
            ];
            foreach ($signs as $sign) {
                $urls[] = [
                    'loc' => $baseUrl . '/horoscopes/free/' . $system . '/' . $sign,
                    'lastmod' => $now,
                    'changefreq' => 'daily',
                    'priority' => '0.5',
                ];
            }
        }

        // Совместимость
        $urls[] = [
            'loc' => $baseUrl . '/horoscopes/compatibility',
            'lastmod' => $now,
            'changefreq' => 'monthly',
            'priority' => '0.7',
        ];

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
