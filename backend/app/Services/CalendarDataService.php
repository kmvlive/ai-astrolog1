<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class CalendarDataService
{
    private const SYNODIC = 29.53058867;
    private const NEW_MOON_TIMESTAMP = 946750440; // Date.UTC(2000, 0, 6, 18, 14, 0) в секундах

    private array $lunarDays;
    private array $lunarAdvice;
    private array $phases;
    private array $garden;
    private array $muslim;
    private array $holidays;
    private array $orthodox;
    private array $haircutGood;
    private array $wiki;

    public function __construct()
    {
        $path = 'data/calendars';
        $this->lunarDays = json_decode(Storage::get("$path/lunar-days.json"), true) ?: [];
        $this->lunarAdvice = json_decode(Storage::get("$path/lunar-advice.json"), true) ?: [];
        $this->phases = json_decode(Storage::get("$path/phases.json"), true) ?: [];
        $this->garden = json_decode(Storage::get("$path/garden.json"), true) ?: [];
        $this->muslim = json_decode(Storage::get("$path/muslim.json"), true) ?: [];
        $this->holidays = json_decode(Storage::get("$path/holidays.json"), true) ?: [];
        $this->orthodox = json_decode(Storage::get("$path/orthodox.json"), true) ?: [];
        $this->haircutGood = json_decode(Storage::get("$path/haircut-good.json"), true) ?: [];
        $this->wiki = json_decode(Storage::get("$path/wiki-days.json"), true) ?: [];
    }

    private function moonAge(Carbon $d): float
    {
        $timestamp = $d->timestamp;
        $days = ($timestamp - self::NEW_MOON_TIMESTAMP) / 86400;
        return fmod($days / self::SYNODIC, 1) * self::SYNODIC;
    }

    private function lunarDay(Carbon $d): int
    {
        return (int) floor($this->moonAge($d)) + 1;
    }

    private function phaseIndex(Carbon $d): int
    {
        return (int) floor(($this->moonAge($d) / self::SYNODIC) * 8 + 0.5) % 8;
    }

    private function phase(Carbon $d): array
    {
        $idx = $this->phaseIndex($d);
        return $this->phases[$idx] ?? ['name' => 'Неизвестно', 'emoji' => '🌙'];
    }

    private function wikiDay(string $key): array
    {
        return $this->wiki[$key] ?? ['intl' => [], 'natl' => [], 'rel' => [], 'names' => []];
    }

    public function getDayInfo(string $slug, Carbon $date): array
    {
        $key = $date->format('m-d');
        $ld = $this->lunarDay($date);
        $phase = $this->phase($date);
        $pi = $this->phaseIndex($date);
        $moonBlock = [
            'h' => '🌙 Лунный фон дня',
            't' => "{$phase['emoji']} {$phase['name']}, {$ld}-е лунные сутки. " . ($this->lunarDays[$ld - 1] ?? '')
        ];

        switch ($slug) {
            case 'holidays':
                $w = $this->wikiDay($key);
                $custom = $this->holidays[$key] ?? [];
                $seen = array_map('strtolower', array_column($custom, 'name'));
                $items = $custom;
                foreach (array_merge($w['intl'] ?? [], $w['natl'] ?? []) as $n) {
                    if (!in_array(strtolower($n), $seen)) {
                        $items[] = ['name' => $n, 'text' => ''];
                    }
                }
                $badge = count($items) ? (count($items) > 1 ? $items[0]['name'] . ' +' . (count($items) - 1) : $items[0]['name']) : null;
                return [
                    'blocks' => [
                        ['h' => '🎉 Праздники дня', 't' => count($items) ? $this->bullets($items) : 'Сегодня нет крупных праздников.'],
                        $moonBlock,
                    ],
                    'rating' => count($items) ? 'good' : null,
                    'badge' => $badge,
                ];

            case 'orthodox':
                $w = $this->wikiDay($key);
                $feast = $this->orthodox[$key] ?? null;
                $rel = $w['rel'] ?? [];
                $blocks = [];
                if ($feast) {
                    $blocks[] = ['h' => '⛪ Великий праздник', 't' => "**$feast** — день молитвы, благодарности и добрых дел."];
                }
                if (count($rel)) {
                    $blocks[] = ['h' => '🕯 Дни памяти святых', 't' => implode("\n", array_map(fn($n) => "• $n", $rel))];
                }
                if (!count($blocks)) {
                    $blocks[] = ['h' => '⛪ День церковного календаря', 't' => 'Сегодня рядовой день: хороший повод для тихой молитвы и добрых дел.'];
                }
                $blocks[] = $moonBlock;
                return ['blocks' => $blocks, 'rating' => $feast || count($rel) ? 'good' : null, 'badge' => $feast ?? ($rel[0] ?? null)];

            case 'muslim':
                $year = $date->year;
                $events = $this->muslim[$year] ?? [];
                $e = null;
                foreach ($events as $event) {
                    if ($event['md'] === $key) {
                        $e = $event;
                        break;
                    }
                }
                return [
                    'blocks' => [
                        ['h' => '☪️ День мусульманского календаря', 't' => $e ? "**{$e['name']}** — важная дата уммы." : 'Сегодня обычных дней великих праздников нет.'],
                        $moonBlock,
                    ],
                    'rating' => $e ? 'good' : null,
                    'badge' => $e['name'] ?? null,
                ];

            case 'lunar':
                return [
                    'blocks' => [
                        ['h' => "{$phase['emoji']} {$phase['name']} · {$ld}-е лунные сутки", 't' => $this->lunarDays[$ld - 1] ?? ''],
                        ['h' => '💡 Рекомендация дня', 't' => $this->lunarAdvice[$pi] ?? ''],
                    ],
                    'badge' => "{$ld}-е лунные сутки",
                ];

            case 'gardener':
                $g = $this->garden[$pi] ?? ['t' => '', 'r' => 'neutral'];
                return [
                    'blocks' => [
                        ['h' => '🌱 Работы в саду и огороде', 't' => $g['t']],
                        ['h' => '💡 Совет', 't' => "Фаза Луны: {$phase['emoji']} {$phase['name']}."],
                        $moonBlock,
                    ],
                    'rating' => $g['r'] ?? 'neutral',
                    'badge' => ($g['r'] ?? '') === 'good' ? 'благоприятно' : (($g['r'] ?? '') === 'bad' ? 'неблагоприятно' : 'сбор урожая'),
                ];

            case 'names':
                $w = $this->wikiDay($key);
                $names = $w['names'] ?? [];
                return [
                    'blocks' => [
                        ['h' => '👼 Именины сегодня', 't' => count($names) ? implode("\n", array_map(fn($n) => "• **$n**", $names)) : 'Сегодня в православном календаре нет именин.'],
                        ['h' => '💡 О дне', 't' => count($names) ? 'Если ваше имя в списке — сегодня ваши именины.' : 'Хороший день, чтобы узнать, в честь какого святого вас назвали.'],
                        $moonBlock,
                    ],
                    'rating' => count($names) ? 'good' : null,
                    'badge' => count($names) ? "именинники: " . count($names) : null,
                ];

            case 'haircut':
                $good = in_array($ld, $this->haircutGood);
                return [
                    'blocks' => [
                        ['h' => $good ? '✅ Благоприятный день для стрижки' : '⛔ Неблагоприятный день для стрижки',
                         't' => $good ? 'Волосы после стрижки будут расти густыми и блестящими.' : 'Считается, что волосы теряют силу. Отложите визит к мастеру.'],
                        ['h' => '💇 Совет мастера', 't' => "{$phase['emoji']} {$phase['name']}: " . ($good ? 'энергия роста направлена вверх.' : 'энергия убывает.')],
                        $moonBlock,
                    ],
                    'rating' => $good ? 'good' : 'bad',
                    'badge' => $good ? 'благоприятно' : 'неблагоприятно',
                ];

            default:
                return ['blocks' => [], 'rating' => null, 'badge' => null];
        }
    }

    private function bullets(array $items): string
    {
        return implode("\n", array_map(function($item) {
            $name = $item['name'] ?? '';
            $text = $item['text'] ?? '';
            return "• **$name**" . ($text ? " — $text" : '');
        }, $items));
    }
}
