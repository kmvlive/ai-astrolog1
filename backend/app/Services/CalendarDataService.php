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
        $this->lunarDays = $this->loadJson("$path/lunar-days.json", []);
        $this->lunarAdvice = $this->loadJson("$path/lunar-advice.json", []);
        $this->phases = $this->loadJson("$path/phases.json", []);
        $this->garden = $this->loadJson("$path/garden.json", []);
        $this->muslim = $this->loadJson("$path/muslim.json", []);
        $this->holidays = $this->loadJson("$path/holidays.json", []);
        $this->orthodox = $this->loadJson("$path/orthodox.json", []);
        $this->haircutGood = $this->loadJson("$path/haircut-good.json", []);
        $this->wiki = $this->loadJson("$path/wiki-days.json", []);

        // Встроенные fallback-данные: рассылка никогда не будет пустой
        if (!$this->phases) {
            $this->phases = [
                ['name' => 'Новолуние', 'emoji' => '🌑'],
                ['name' => 'Растущий серп', 'emoji' => '🌒'],
                ['name' => 'Первая четверть', 'emoji' => '🌓'],
                ['name' => 'Растущая луна', 'emoji' => '🌔'],
                ['name' => 'Полнолуние', 'emoji' => '🌕'],
                ['name' => 'Убывающая луна', 'emoji' => '🌖'],
                ['name' => 'Последняя четверть', 'emoji' => '🌗'],
                ['name' => 'Убывающий серп', 'emoji' => '🌘'],
            ];
        }
        if (!$this->lunarDays) {
            $this->lunarDays = array_fill(0, 30, 'День несёт свою энергетику — действуйте осознанно и внимательно.');
        }
        if (!$this->lunarAdvice) {
            $this->lunarAdvice = array_fill(0, 30, 'Прислушивайтесь к себе, не форсируйте события и завершайте начатое.');
        }
    }

    private function loadJson(string $path, $default)
    {
        // Читаем напрямую через файловую систему — надёжнее Storage (не зависит от конфигурации дисков)
        $candidates = [
            storage_path('app/' . $path),
            base_path('storage/app/' . $path),
        ];

        foreach ($candidates as $file) {
            if (is_file($file) && is_readable($file)) {
                $content = @file_get_contents($file);
                if ($content !== false && $content !== '') {
                    $decoded = json_decode($content, true);
                    if ($decoded !== null) {
                        return $decoded;
                    }
                }
            }
        }

        // Фолбэк через Storage (вдруг диск настроен иначе)
        try {
            $content = Storage::get($path);
            if ($content) {
                return json_decode($content, true) ?: $default;
            }
        } catch (\Exception $e) {
            // ignore
        }

        return $default;
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
                $items = $custom;
                $seen = array_map(fn($n) => mb_strtolower((string) $n), array_column($custom, 'name'));

                // Убираем префикс "— " (так в wiki-days помечены даты без страны)
                $clean = fn(string $raw): string => trim(preg_replace('/^\s*—\s*/u', '', trim($raw)));

                // Международные дни — всегда
                foreach ($w['intl'] ?? [] as $raw) {
                    $n = $clean((string) $raw);
                    if ($n !== '' && !in_array(mb_strtolower($n), $seen, true)) {
                        $items[] = ['name' => $n, 'text' => ''];
                        $seen[] = mb_strtolower($n);
                    }
                }

                // Из национальных берём только Россию и даты без страны
                foreach ($w['natl'] ?? [] as $raw) {
                    $raw = trim((string) $raw);
                    $isRu = mb_stripos($raw, 'Россия') !== false || mb_stripos($raw, 'РФ') !== false;
                    $noCountry = str_starts_with($raw, '—');
                    if (!$isRu && !$noCountry) {
                        continue;
                    }
                    $n = $clean($raw);
                    if ($n !== '' && !in_array(mb_strtolower($n), $seen, true)) {
                        $items[] = ['name' => $n, 'text' => ''];
                        $seen[] = mb_strtolower($n);
                    }
                }

                // Не больше 6 пунктов в письме
                $items = array_slice($items, 0, 6);
                $badge = count($items) ? (count($items) > 1 ? $items[0]['name'] . ' +' . (count($items) - 1) : $items[0]['name']) : null;
                $blocks = [
                    ['h' => '🎉 Праздники дня', 't' => count($items) ? $this->bullets($items) : 'Сегодня нет крупных праздников.'],
                ];
                if ($nb = $this->nameDayBlock($key)) {
                    $blocks[] = $nb;
                }
                $blocks[] = $moonBlock;
                return ['blocks' => $blocks, 'rating' => count($items) ? 'good' : null, 'badge' => $badge];

            case 'orthodox':
                $w = $this->wikiDay($key);
                $feast = $this->orthodox[$key] ?? null;
                $rel = $w['rel'] ?? [];
                $blocks = [];
                if ($feast) {
                    $blocks[] = ['h' => '⛪ Великий праздник', 't' => "$feast — день молитвы, благодарности и добрых дел."];
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
                $blocks = [];
                if ($e) {
                    $blocks[] = ['h' => '☪️ ' . $e['name'], 't' => $e['text'] ?? ''];
                } else {
                    $blocks[] = ['h' => '☪️ День мусульманского календаря', 't' => 'Сегодня обычный день по исламскому календарю.'];
                }
                $blocks[] = $moonBlock;
                return ['blocks' => $blocks, 'rating' => $e ? 'good' : null, 'badge' => $e['name'] ?? null];

            case 'lunar':
                $advice = $this->lunarAdvice[$ld - 1] ?? '';
                return [
                    'blocks' => [
                        ['h' => "{$phase['emoji']} {$phase['name']} · {$ld}-е лунные сутки", 't' => $this->lunarDays[$ld - 1] ?? ''],
                        ['h' => '💡 Рекомендация дня', 't' => $advice],
                        $moonBlock,
                    ],
                    'rating' => in_array($ld, [1, 7, 14, 21, 28]) ? 'good' : (in_array($ld, [9, 19, 23, 29]) ? 'bad' : null),
                    'badge' => "{$ld}-е лунные сутки",
                ];

            case 'gardener':
                $g = $this->garden[$key] ?? null;
                $blocks = [];
                if ($g) {
                    $blocks[] = ['h' => '🌱 ' . ($g['title'] ?? 'Садовый день'), 't' => $g['text'] ?? ''];
                    if (!empty($g['works'])) {
                        $blocks[] = ['h' => '✅ Что делать', 't' => $this->bulletsText($g['works'])];
                    }
                    if (!empty($g['avoid'])) {
                        $blocks[] = ['h' => '❌ Чего избегать', 't' => $this->bulletsText($g['avoid'])];
                    }
                } else {
                    $blocks[] = ['h' => '🌱 Садовый календарь', 't' => 'Сегодня нейтральный день для садовых работ.'];
                }
                $blocks[] = $moonBlock;
                return ['blocks' => $blocks, 'rating' => $g ? ($g['rating'] ?? null) : null, 'badge' => $g['title'] ?? null];

            case 'haircut':
                $good = in_array($ld, $this->haircutGood);
                $blocks = [
                    ['h' => $good ? '✂️ Хороший день для стрижки' : '✂️ Стрижка сегодня', 't' => $good ? 'Лунный день благоприятен для обновления причёски — волосы будут расти хорошо.' : 'Сегодня лучше воздержаться от стрижки. Лунный день не способствует здоровью волос.']
                ];
                $blocks[] = $moonBlock;
                return ['blocks' => $blocks, 'rating' => $good ? 'good' : 'bad', 'badge' => $good ? 'Благоприятно' : 'Не рекомендуется'];

            case 'names':
                $names = $this->nameDayNames($key);
                $blocks = [];
                if (count($names)) {
                    $blocks[] = ['h' => '👼 Именины сегодня', 't' => implode(', ', $names) . '. День небесного покровителя носителей этих имён.'];
                    $known = \App\Models\NameMeaning::whereIn('name', $names)
                        ->where('approved', true)
                        ->orderByDesc('views')
                        ->limit(3)
                        ->get();
                    if ($known->count()) {
                        $lines = [];
                        foreach ($known as $nm) {
                            $lines[] = '• ' . $nm->name . ' — значение имени: my.neiro-astro.ru/names/' . $nm->translit;
                        }
                        $blocks[] = ['h' => '✨ Узнать больше', 't' => implode("\n", $lines)];
                    }
                } else {
                    $blocks[] = ['h' => '👼 Календарь именин', 't' => 'Сегодня святцы не отмечают именин из нашего списка.'];
                }
                $blocks[] = $moonBlock;
                return ['blocks' => $blocks, 'rating' => count($names) ? 'good' : null, 'badge' => $names[0] ?? null];

            default:
                return ['blocks' => [$moonBlock], 'rating' => null, 'badge' => null];
        }
    }

    private const SAINT_NAMES = ['Август', 'Августин', 'Авдей', 'Агап', 'Агапит', 'Агафангел', 'Агафия', 'Агафон', 'Аггей', 'Акулина', 'Александр', 'Александра', 'Алексий', 'Амвросий', 'Аммон', 'Анатолий', 'Андрей', 'Андроник', 'Аникита', 'Анна', 'Антон', 'Антонин', 'Анфим', 'Анфиса', 'Аполлинария', 'Аполлос', 'Аркадий', 'Арсений', 'Артемий', 'Архип', 'Афанасий', 'Афинодор', 'Ахилла', 'Валентин', 'Валериан', 'Варвара', 'Варлам', 'Варсонофий', 'Варфоломей', 'Василий', 'Вениамин', 'Вера', 'Вероника', 'Виктор', 'Викторин', 'Виссарион', 'Вит', 'Владимир', 'Вонифатий', 'Вуккол', 'Гавриил', 'Гай', 'Галактион', 'Геннадий', 'Георгий', 'Гликерия', 'Гордий', 'Горгоний', 'Григорий', 'Гурий', 'Давид', 'Даниил', 'Демид', 'Денис', 'Дмитрий', 'Дорофей', 'Досифей', 'Евгений', 'Евдокия', 'Евграф', 'Евдоким', 'Евфимий', 'Евфросиния', 'Екатерина', 'Елена', 'Елисей', 'Епифан', 'Еремей', 'Ефим', 'Ефрем', 'Ефросинья', 'Зенон', 'Зинаида', 'Зосима', 'Иакинф', 'Иван', 'Игнатий', 'Иларион', 'Иннокентий', 'Иов', 'Иоанн', 'Иоанна', 'Иона', 'Иосиф', 'Ипатий', 'Ипполит', 'Ирина', 'Исидор', 'Иулиан', 'Иулиания', 'Иулитта', 'Каллиник', 'Каллистрат', 'Кандид', 'Киприан', 'Кирик', 'Кирилл', 'Клавдия', 'Клавдий', 'Климент', 'Кондратий', 'Корнилий', 'Косма', 'Кристина', 'Ксения', 'Кузьма', 'Кукша', 'Лавр', 'Лаврентий', 'Лев', 'Леонид', 'Леонтий', 'Ливерий', 'Лидия', 'Лонгин', 'Лука', 'Лукиан', 'Лупп', 'Макар', 'Максим', 'Мариамна', 'Марина', 'Мария', 'Марк', 'Маркел', 'Мартирий', 'Мартин', 'Матрона', 'Мелетий', 'Мефодий', 'Мина', 'Мирон', 'Михаил', 'Модест', 'Моисей', 'Никандр', 'Никанор', 'Никита', 'Никифор', 'Никодим', 'Николай', 'Нил', 'Нифонт', 'Ольга', 'Онисим', 'Онисифор', 'Орест', 'Осия', 'Павлин', 'Павел', 'Паисий', 'Панкратий', 'Пантелеимон', 'Пармен', 'Пелагея', 'Петр', 'Пимен', 'Платон', 'Поликарп', 'Прасковья', 'Прокопий', 'Прокл', 'Прохор', 'Раиса', 'Роман', 'Руфин', 'Савва', 'Савватий', 'Самуил', 'Севастьян', 'Серапион', 'Серафим', 'Сергий', 'Сильван', 'Симеон', 'Симон', 'Соломонида', 'Софрон', 'Софья', 'Спиридон', 'Стефан', 'Сусанна', 'Тарас', 'Татьяна', 'Терентий', 'Тихон', 'Трифон', 'Трофим', 'Уар', 'Ульяна', 'Урбан', 'Фаддей', 'Федор', 'Федот', 'Феофан', 'Филарет', 'Филипп', 'Фирс', 'Фотий', 'Фока', 'Фрол', 'Харитон', 'Христофор', 'Юлиан', 'Юлия', 'Яков', 'Януарий', 'Аудомар', 'Ортольд', 'Кнут', 'Раймунд', 'Карл', 'Шушаника', 'Бригитта', 'Патрикий', 'Колумба', 'Эдиль', 'Вульмар', 'Феликс', 'Адриан', 'Евстафий', 'Плацид', 'Кассиан', 'Кассия', 'Схоластика', 'Бенедикт', 'Сильвестр', 'Цецилия', 'Люция', 'Агния', 'Валерия', 'Домнина', 'Феодора', 'Феодор', 'Феоктист', 'Евсевий', 'Евтихий', 'Елпидий', 'Аникет', 'Памва', 'Дионисий', 'Малахия', 'Авксентий', 'Кесарий'];

    private function nameDayNames(string $key): array
    {
        $w = $this->wikiDay($key);
        $names = array_values(array_filter($w['names'] ?? [], fn($n) => is_string($n) && trim($n) !== ''));
        return array_values(array_intersect($names, self::SAINT_NAMES));
    }

    private function nameDayBlock(string $key): ?array
    {
        $names = $this->nameDayNames($key);
        if (!count($names)) {
            return null;
        }
        return ['h' => '👼 Именины сегодня', 't' => implode(', ', $names) . '.'];
    }

    private function bullets(array $items): string
    {
        $lines = [];
        foreach ($items as $item) {
            $name = $item['name'] ?? '';
            $text = $item['text'] ?? '';
            if ($text) {
                $lines[] = "• {$name} — {$text}";
            } else {
                $lines[] = "• {$name}";
            }
        }
        return implode("\n", $lines);
    }

    private function bulletsText(array $items): string
    {
        return implode("\n", array_map(fn($t) => "• " . str_replace('**', '', $t), $items));
    }
}
