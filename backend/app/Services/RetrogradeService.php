<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class RetrogradeService
{
    // Кеплерианские элементы (J2000) + скорости за столетие — JPL approximate ephemeris
    private const PLANETS = [
        'mercury' => ['name' => 'Меркурий', 'glyph' => '☿', 'a' => [0.38709927, 0.00000037], 'e' => [0.20563593, 0.00001906], 'i' => [7.00497902, -0.00594749], 'L' => [252.25032350, 149472.67411175], 'peri' => [77.45779628, 0.16047689], 'node' => [48.33076593, -0.12534081]],
        'venus'   => ['name' => 'Венера',   'glyph' => '♀', 'a' => [0.72333566, 0.00000390], 'e' => [0.00677672, -0.00004107], 'i' => [3.39467605, -0.00078890], 'L' => [181.97909950, 58517.81538729], 'peri' => [131.60246718, 0.00268329], 'node' => [76.67984255, -0.27769418]],
        'mars'    => ['name' => 'Марс',     'glyph' => '♂', 'a' => [1.52371034, 0.00001847], 'e' => [0.09339410, 0.00007882], 'i' => [1.84969142, -0.00813131], 'L' => [-4.55343205, 19140.30268499], 'peri' => [-23.94362959, 0.44441088], 'node' => [49.55953891, -0.29257343]],
        'jupiter' => ['name' => 'Юпитер',   'glyph' => '♃', 'a' => [5.20288700, -0.00011607], 'e' => [0.04838624, -0.00013253], 'i' => [1.30439695, -0.00183714], 'L' => [34.39644051, 3034.74612775], 'peri' => [14.72847983, 0.21252668], 'node' => [100.47390909, 0.20469106]],
        'saturn'  => ['name' => 'Сатурн',   'glyph' => '♄', 'a' => [9.53667594, -0.00125060], 'e' => [0.05386179, -0.00050991], 'i' => [2.48599187, 0.00193609], 'L' => [49.95424423, 1222.49362201], 'peri' => [92.59887831, -0.41897216], 'node' => [113.66242448, -0.28867794]],
        'uranus'  => ['name' => 'Уран',     'glyph' => '♅', 'a' => [19.18916464, -0.00196176], 'e' => [0.04725744, -0.00004397], 'i' => [0.77263783, -0.00242939], 'L' => [313.23810451, 428.48202785], 'peri' => [170.95427630, 0.40805281], 'node' => [74.01692503, 0.04240589]],
        'neptune' => ['name' => 'Нептун',   'glyph' => '♆', 'a' => [30.06992276, 0.00026291], 'e' => [0.00859048, 0.00005105], 'i' => [1.77004347, 0.00035372], 'L' => [-55.12002969, 218.45945325], 'peri' => [44.96476227, -0.32241464], 'node' => [131.78422574, -0.00508664]],
        'pluto'   => ['name' => 'Плутон',   'glyph' => '♇', 'a' => [39.48211675, -0.00031596], 'e' => [0.24882730, 0.00005170], 'i' => [17.14001206, 0.00004818], 'L' => [238.92903833, 145.20780515], 'peri' => [224.06891629, -0.04062942], 'node' => [110.30393684, -0.01183482]],
    ];

    private const EARTH = ['a' => [1.00000261, 0.00000562], 'e' => [0.01671123, -0.00004392], 'i' => [-0.00001531, -0.01294668], 'L' => [100.46457166, 35999.37244981], 'peri' => [102.93768193, 0.32327364], 'node' => [0.0, 0.0]];

    public function summary(): array
    {
        return Cache::remember('retrograde_summary', 21600, function () {
            $jd = $this->jd(Carbon::now('UTC'));
            $out = [];
            foreach (self::PLANETS as $key => $p) {
                $motion = $this->dailyMotion($key, $jd);
                $retro = $motion < 0;
                $item = [
                    'key' => $key,
                    'name' => $p['name'],
                    'glyph' => $p['glyph'],
                    'is_retrograde' => $retro,
                    'daily_motion_arcmin' => round(abs($motion) * 60, 1),
                    'period_start' => null,
                    'period_end' => null,
                    'next_start' => null,
                    'next_end' => null,
                ];
                if ($retro) {
                    [$item['period_start'], $item['period_end']] = $this->currentPeriod($key, $jd);
                } else {
                    [$item['next_start'], $item['next_end']] = $this->nextPeriod($key, $jd);
                }
                $out[] = $item;
            }
            return ['planets' => $out, 'updated_at' => Carbon::now()->toIso8601String()];
        });
    }

    // --- Периоды ---

    private function currentPeriod(string $key, float $jd): array
    {
        // назад до станции (ретро -> директ)
        $back = $jd;
        for ($d = 0; $d < 400; $d++) {
            if ($this->dailyMotion($key, $back) >= 0) break;
            $back -= 1;
        }
        $start = $this->bisect($key, $back, $jd);

        $fwd = $jd;
        for ($d = 0; $d < 400; $d++) {
            if ($this->dailyMotion($key, $fwd) >= 0) break;
            $fwd += 1;
        }
        $end = $this->bisect($key, $fwd, $jd);

        return [$this->dateStr($start), $this->dateStr($end)];
    }

    private function nextPeriod(string $key, float $jd): array
    {
        $scan = $jd;
        $found = null;
        for ($d = 0; $d < 900; $d++) {
            if ($this->dailyMotion($key, $scan) < 0) { $found = $scan; break; }
            $scan += 1;
        }
        if ($found === null) return [null, null];

        $start = $this->bisect($key, $found - 1, $found);
        $fwd = $found;
        for ($d = 0; $d < 400; $d++) {
            if ($this->dailyMotion($key, $fwd) >= 0) break;
            $fwd += 1;
        }
        $end = $this->bisect($key, $fwd, $found);

        return [$this->dateStr($start), $this->dateStr($end)];
    }

    // Бисекция станции между директной и ретроградной точкой
    private function bisect(string $key, float $jdDirect, float $jdRetro): float
    {
        for ($i = 0; $i < 40; $i++) {
            $mid = ($jdDirect + $jdRetro) / 2;
            if ($this->dailyMotion($key, $mid) < 0) $jdRetro = $mid;
            else $jdDirect = $mid;
        }
        return ($jdDirect + $jdRetro) / 2;
    }

    // --- Астрономия ---

    public function dailyMotion(string $key, float $jd): float
    {
        $l1 = $this->geocentricLongitude($key, $jd - 0.5);
        $l2 = $this->geocentricLongitude($key, $jd + 0.5);
        return $this->norm180($l2 - $l1);
    }

    public function geocentricLongitude(string $key, float $jd): float
    {
        $p = $this->heliocentric(self::PLANETS[$key], $jd);
        $e = $this->heliocentric(self::EARTH, $jd);
        return fmod(rad2deg(atan2($p['y'] - $e['y'], $p['x'] - $e['x'])) + 360, 360);
    }

    private function heliocentric(array $el, float $jd): array
    {
        $T = ($jd - 2451545.0) / 36525.0;
        $a = $el['a'][0] + $el['a'][1] * $T;
        $e = $el['e'][0] + $el['e'][1] * $T;
        $i = deg2rad($el['i'][0] + $el['i'][1] * $T);
        $L = $el['L'][0] + $el['L'][1] * $T;
        $peri = $el['peri'][0] + $el['peri'][1] * $T;
        $node = deg2rad($el['node'][0] + $el['node'][1] * $T);

        $M = fmod($L - $peri, 360);
        if ($M > 180) $M -= 360;
        if ($M < -180) $M += 360;
        $Mr = deg2rad($M);

        // Уравнение Кеплера
        $E = $Mr + $e * sin($Mr);
        for ($k = 0; $k < 20; $k++) {
            $dE = ($E - $e * sin($E) - $Mr) / (1 - $e * cos($E));
            $E -= $dE;
            if (abs($dE) < 1e-10) break;
        }

        $xp = $a * (cos($E) - $e);
        $yp = $a * sqrt(1 - $e * $e) * sin($E);

        $w = deg2rad($peri) - $node;
        $cw = cos($w); $sw = sin($w);
        $cn = cos($node); $sn = sin($node);
        $ci = cos($i); $si = sin($i);

        return [
            'x' => $xp * ($cw * $cn - $sw * $sn * $ci) + $yp * (-$sw * $cn - $cw * $sn * $ci),
            'y' => $xp * ($cw * $sn + $sw * $cn * $ci) + $yp * (-$sw * $sn + $cw * $cn * $ci),
            'z' => $xp * ($sw * $si) + $yp * ($cw * $si),
        ];
    }

    private function jd(Carbon $date): float
    {
        return $date->getTimestamp() / 86400 + 2440587.5;
    }

    private function dateStr(float $jd): string
    {
        $ts = (int) round(($jd - 2440587.5) * 86400);
        return Carbon::createFromTimestamp($ts, 'UTC')->timezone(config('app.timezone'))->format('Y-m-d');
    }

    private function norm180(float $x): float
    {
        $x = fmod($x + 180, 360);
        if ($x < 0) $x += 360;
        return $x - 180;
    }
}
