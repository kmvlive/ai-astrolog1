<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyHoroscope;
use App\Services\AiService;
use Illuminate\Http\Request;

class DailyHoroscopeController extends Controller
{
    public const SIGNS = [
        'oven' => ['code' => 'Ari', 'name' => 'Овен', 'emoji' => '♈'],
        'telec' => ['code' => 'Tau', 'name' => 'Телец', 'emoji' => '♉'],
        'bliznecy' => ['code' => 'Gem', 'name' => 'Близнецы', 'emoji' => '♊'],
        'rak' => ['code' => 'Can', 'name' => 'Рак', 'emoji' => '♋'],
        'lev' => ['code' => 'Leo', 'name' => 'Лев', 'emoji' => '♌'],
        'deva' => ['code' => 'Vir', 'name' => 'Дева', 'emoji' => '♍'],
        'vesy' => ['code' => 'Lib', 'name' => 'Весы', 'emoji' => '♎'],
        'skorpion' => ['code' => 'Sco', 'name' => 'Скорпион', 'emoji' => '♏'],
        'strelec' => ['code' => 'Sag', 'name' => 'Стрелец', 'emoji' => '♐'],
        'kozerog' => ['code' => 'Cap', 'name' => 'Козерог', 'emoji' => '♑'],
        'vodoley' => ['code' => 'Aqu', 'name' => 'Водолей', 'emoji' => '♒'],
        'ryby' => ['code' => 'Pis', 'name' => 'Рыбы', 'emoji' => '♓'],
    ];

    private const TYPES = ['general', 'love', 'career', 'financial', 'health'];

    public function index()
    {
        $signs = [];
        foreach (self::SIGNS as $slug => $sign) {
            $signs[] = [
                'slug' => $slug,
                'name' => $sign['name'],
                'emoji' => $sign['emoji'],
            ];
        }

        return response()->json([
            'signs' => $signs,
            'date' => now()->startOfDay()->toDateString(),
        ]);
    }

    public function show(Request $request, string $slug)
    {
        if (!isset(self::SIGNS[$slug])) {
            return response()->json(['error' => 'Знак не найден'], 404);
        }

        $type = $request->query('type', 'general');
        if (!in_array($type, self::TYPES)) {
            $type = 'general';
        }

        $sign = self::SIGNS[$slug];
        $date = now()->startOfDay();

        $horoscope = DailyHoroscope::where('date', $date)
            ->where('zodiac_sign', $sign['code'])
            ->where('type', $type)
            ->first();

        // Ленивая генерация при первом запросе
        if (!$horoscope) {
            $content = app(AiService::class)->generateDailyHoroscope($sign['code'], $sign['name'], $date, $type);
            if ($content) {
                $horoscope = DailyHoroscope::create([
                    'date' => $date,
                    'zodiac_sign' => $sign['code'],
                    'type' => $type,
                    'content' => $content,
                ]);
            }
        }

        if (!$horoscope) {
            return response()->json(['error' => 'Гороскоп временно недоступен'], 503);
        }

        return response()->json([
            'horoscope' => $horoscope,
            'sign' => $sign,
            'type' => $type,
            'date' => $date->toDateString(),
        ]);
    }
}
