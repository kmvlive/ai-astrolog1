<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\DailyHoroscope;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FeedController extends Controller
{
    private const GENITIVE = [
        'Ari' => 'Овна', 'Tau' => 'Тельца', 'Gem' => 'Близнецов',
        'Can' => 'Рака', 'Leo' => 'Льва', 'Vir' => 'Девы',
        'Lib' => 'Весов', 'Sco' => 'Скорпиона', 'Sag' => 'Стрельца',
        'Cap' => 'Козерога', 'Aqu' => 'Водолея', 'Pis' => 'Рыб',
    ];

    private const SYMBOLS = [
        'Ari' => '♈', 'Tau' => '♉', 'Gem' => '♊', 'Can' => '♋',
        'Leo' => '♌', 'Vir' => '♍', 'Lib' => '♎', 'Sco' => '♏',
        'Sag' => '♐', 'Cap' => '♑', 'Aqu' => '♒', 'Pis' => '♓',
    ];

    public function index()
    {
        $date = now()->startOfDay();
        $items = [];

        // Свежая статья блога — в общем фиде
        $blog = BlogPost::published()->orderByDesc('published_at')->first();
        if ($blog) $items[] = $this->blogItem($blog);

        foreach (DailyHoroscopeController::SIGNS as $slug => $sign) {
            $h = DailyHoroscope::where('date', $date)
                ->where('zodiac_sign', $sign['code'])
                ->where('type', 'general')
                ->where('period', 'today')
                ->first();

            if ($h) {
                $gen = self::GENITIVE[$sign['code']];
                $link = "https://my.neiro-astro.ru/horoscopes/{$slug}?period=today";
                $img = $this->signImage($sign['code'], $sign['name']);
                $items[] = [
                    'title' => "Гороскоп {$gen} — " . $date->locale('ru')->isoFormat('D MMMM YYYY'),
                    'link' => $link,
                    'description' => $this->teaser($h->content, $link, $img),
                    'pubDate' => $date->copy()->setTime(8, 0)->toRssString(),
                    'guid' => "horoscope-{$sign['code']}-{$date->toDateString()}",
                    'image' => $img,
                ];
            }
        }

        return $this->rss(
            'AI Астролог — гороскопы на каждый день',
            'https://my.neiro-astro.ru/horoscopes',
            'Бесплатные ежедневные гороскопы для всех 12 знаков зодиака и статьи блога',
            $items
        );
    }

    public function sign(string $slug)
    {
        if (!isset(DailyHoroscopeController::SIGNS[$slug])) {
            return response('Not found', 404);
        }
        $sign = DailyHoroscopeController::SIGNS[$slug];
        $gen = self::GENITIVE[$sign['code']];
        $items = [];

        $date = now()->startOfDay();
        $h = DailyHoroscope::where('date', $date)
            ->where('zodiac_sign', $sign['code'])
            ->where('type', 'general')
            ->where('period', 'today')
            ->first();

        if ($h) {
            $link = "https://my.neiro-astro.ru/horoscopes/{$slug}?period=today";
            $img = $this->signImage($sign['code'], $sign['name']);
            $items[] = [
                'title' => "Гороскоп {$gen} — " . $date->locale('ru')->isoFormat('D MMMM YYYY'),
                'link' => $link,
                'description' => $this->teaser($h->content, $link, $img),
                'pubDate' => $date->copy()->setTime(8, 0)->toRssString(),
                'guid' => "horoscope-{$sign['code']}-{$date->toDateString()}",
                'image' => $img,
            ];
        }

        // Добавляем последние посты блога
        $blogPosts = BlogPost::published()->orderByDesc('published_at')->take(5)->get();
        foreach ($blogPosts as $p) {
            $items[] = $this->blogItem($p);
        }

        return $this->rss(
            "Гороскоп {$gen} — AI Астролог",
            "https://my.neiro-astro.ru/horoscopes/{$slug}",
            "Ежедневный гороскоп для знака {$sign['name']}",
            $items
        );
    }

    // Новый канал: блог
    public function blog()
    {
        $posts = BlogPost::published()->orderByDesc('published_at')->take(15)->get();
        $items = $posts->map(fn ($p) => $this->blogItem($p))->all();

        return $this->rss(
            'AI Астролог — Блог',
            'https://my.neiro-astro.ru/blog',
            'Ежедневные прогнозы, разборы энергий дня и профессиональные советы от AI-астролога',
            $items
        );
    }

    private function blogItem(BlogPost $p): array
    {
        $link = route('blog.show', $p);
        $text = mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags(Str::markdown($p->content)))), 0, 900);
        $img = $p->cover_image ? asset('storage/' . $p->cover_image) : null;

        $html = ($img ? '<img src="' . $img . '" alt="' . htmlspecialchars($p->title, ENT_XML1) . '" style="width:100%;max-width:600px;border-radius:8px;margin:0 0 12px;" />' : '')
            . '<p style="margin:0 0 12px;line-height:1.7;color:#1e293b;">' . htmlspecialchars($text . '…', ENT_XML1) . '</p>'
            . '<p style="margin:12px 0 0;"><a href="' . htmlspecialchars($link, ENT_XML1) . '" style="color:#7c3aed;font-weight:bold;">Читать полностью: ' . htmlspecialchars($link, ENT_XML1) . '</a></p>';

        return [
            'title' => $p->title,
            'link' => $link,
            'description' => $html,
            'pubDate' => $p->published_at->toRssString(),
            'guid' => $link,
            'image' => $img,
        ];
    }

    // SVG-обложка знака зодиака (генерируется один раз)
    private function signImage(string $code, string $name): string
    {
        $file = 'rss-covers/' . $code . '.svg';
        if (!Storage::disk('public')->exists($file)) {
            Storage::disk('public')->makeDirectory('rss-covers');
            mt_srand(crc32($code));
            $stars = '';
            for ($i = 0; $i < 70; $i++) {
                $x = mt_rand(0, 1200); $y = mt_rand(0, 800);
                $r = mt_rand(4, 20) / 10;
                $o = number_format(mt_rand(25, 100) / 100, 2, '.', '');
                $stars .= "<circle cx='{$x}' cy='{$y}' r='{$r}' fill='#ffffff' opacity='{$o}'/>";
            }
            $sym = self::SYMBOLS[$code] ?? '✨';
            $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="0.5" stop-color="#4c1d95"/><stop offset="1" stop-color="#2e1065"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#fef3c7" stop-opacity="0.7"/><stop offset="1" stop-color="#fcd34d" stop-opacity="0"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
</defs>
<rect width="1200" height="800" fill="url(#bg)"/>
<ellipse cx="300" cy="650" rx="320" ry="200" fill="#7c3aed" opacity="0.25" filter="url(#blur)"/>
<ellipse cx="950" cy="150" rx="280" ry="170" fill="#db2777" opacity="0.16" filter="url(#blur)"/>
{$stars}
<circle cx="600" cy="380" r="230" fill="url(#glow)"/>
<circle cx="600" cy="380" r="170" fill="none" stroke="#fcd34d" stroke-width="3" opacity="0.7"/>
<text x="600" y="460" font-family="Georgia, serif" font-size="220" fill="#fde68a" text-anchor="middle">{$sym}</text>
<text x="600" y="700" font-family="Georgia, serif" font-size="52" fill="#e9d5ff" text-anchor="middle" opacity="0.9">{$name}</text>
<text x="600" y="90" font-family="Georgia, serif" font-size="34" fill="#c4b5fd" text-anchor="middle" opacity="0.8">AI Астролог</text>
</svg>
SVG;
            Storage::disk('public')->put($file, $svg);
        }
        return asset('storage/' . $file);
    }

    private function teaser(string $content, string $url, ?string $image = null): string
    {
        $paragraphs = array_values(array_filter(array_map('trim', preg_split('/\n+/', $content))));

        $teaser = '';
        foreach ($paragraphs as $p) {
            $candidate = $teaser === '' ? $p : $teaser . "\n\n" . $p;
            if (mb_strlen($candidate) > 900) break;
            $teaser = $candidate;
        }
        if ($teaser === '') {
            $teaser = mb_substr($content, 0, 900);
        }

        $html = $image ? '<img src="' . $image . '" alt="" style="width:100%;max-width:600px;border-radius:8px;margin:0 0 12px;" />' : '';
        foreach (explode("\n\n", $teaser) as $p) {
            $html .= '<p style="margin:0 0 12px;line-height:1.7;color:#1e293b;">'
                . htmlspecialchars($p, ENT_XML1) . '</p>';
        }
        $html .= '<p style="margin:12px 0 0;">'
            . '<a href="' . htmlspecialchars($url, ENT_XML1) . '" style="color:#7c3aed;font-weight:bold;">'
            . 'Читать полностью на my.neiro-astro.ru →</a></p>';

        return $html;
    }

    private function rss(string $title, string $link, string $description, array $items)
    {
        $itemsXml = '';
        foreach ($items as $i) {
            $itemsXml .= '<item>'
                . '<title>' . htmlspecialchars($i['title'], ENT_XML1) . '</title>'
                . '<link>' . htmlspecialchars($i['link'], ENT_XML1) . '</link>'
                . '<guid isPermaLink="' . (str_starts_with($i['guid'], 'http') ? 'true' : 'false') . '">' . htmlspecialchars($i['guid'], ENT_XML1) . '</guid>'
                . '<pubDate>' . $i['pubDate'] . '</pubDate>'
                . '<description><![CDATA[' . str_replace(']]>', ']]]]><![CDATA[>', $i['description']) . ']]></description>'
                . (!empty($i['image']) ? '<media:content url="' . htmlspecialchars($i['image'], ENT_XML1) . '" medium="image" type="image/jpeg" width="1200" height="800"/><media:thumbnail url="' . htmlspecialchars($i['image'], ENT_XML1) . '"/>' : '')
                . '</item>';
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            . '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>'
            . '<title>' . htmlspecialchars($title, ENT_XML1) . '</title>'
            . '<link>' . htmlspecialchars($link, ENT_XML1) . '</link>'
            . '<description>' . htmlspecialchars($description, ENT_XML1) . '</description>'
            . '<language>ru</language>'
            . '<lastBuildDate>' . now()->toRssString() . '</lastBuildDate>'
            . $itemsXml
            . '</channel></rss>';

        return response($xml, 200, ['Content-Type' => 'application/rss+xml; charset=UTF-8']);
    }
}
