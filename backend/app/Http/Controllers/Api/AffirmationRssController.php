<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affirmation;
use Illuminate\Http\Response;

class AffirmationRssController extends Controller
{
    public function feed()
    {
        $affirmations = Affirmation::orderBy('date', 'desc')
            ->limit(30)
            ->get();

        $baseUrl = rtrim(config('app.url'), '/');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n";
        $xml .= '  <channel>' . "\n";
        $xml .= '    <title>Ежедневные аффирмации — AI Астролог</title>' . "\n";
        $xml .= '    <link>' . $baseUrl . '/affirmations</link>' . "\n";
        $xml .= '    <description>Ежедневные вдохновляющие аффирмации для гармонии и позитивного настроя. Новая аффирмация каждый день.</description>' . "\n";
        $xml .= '    <language>ru-ru</language>' . "\n";
        $xml .= '    <lastBuildDate>' . now()->toRssString() . '</lastBuildDate>' . "\n";
        $xml .= '    <atom:link href="' . $baseUrl . '/api/affirmations/rss" rel="self" type="application/rss+xml"/>' . "\n";

        foreach ($affirmations as $affirmation) {
            $url = $baseUrl . '/affirmations/' . $affirmation->date->format('Y-m-d');
            $xml .= '    <item>' . "\n";
            $xml .= '      <title>' . htmlspecialchars($affirmation->title) . '</title>' . "\n";
            $xml .= '      <link>' . $url . '</link>' . "\n";
            $xml .= '      <guid isPermaLink="true">' . $url . '</guid>' . "\n";
            $xml .= '      <pubDate>' . $affirmation->date->toRssString() . '</pubDate>' . "\n";
            $xml .= '      <description><![CDATA[' . "\n";
            $xml .= '        <p><strong>' . htmlspecialchars($affirmation->title) . '</strong></p>' . "\n";
            $xml .= '        <p>' . htmlspecialchars($affirmation->description) . '</p>' . "\n";
            $xml .= '        <p><a href="' . $url . '">Читать полностью →</a></p>' . "\n";
            $xml .= '      ]]></description>' . "\n";
            $xml .= '    </item>' . "\n";
        }

        $xml .= '  </channel>' . "\n";
        $xml .= '</rss>';

        return response($xml, 200)
            ->header('Content-Type', 'application/rss+xml; charset=UTF-8')
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
