<?php

namespace App\Services;

use App\Models\FreeDailyHoroscope;
use Carbon\Carbon;

class FreeHoroscopeService
{
    public function systems(): array
    {
        return config('horoscope_systems', []);
    }

    public function system(string $slug): ?array
    {
        $s = $this->systems()[$slug] ?? null;
        if (!$s) return null;
        $s['slug'] = $slug;
        return $s;
    }

    /** Знак по году рождения (китайский 12, японский 9) */
    public function signByYear(string $system, int $year): ?string
    {
        $signs = array_keys($this->systems()[$system]['signs'] ?? []);
        if (!$signs) return null;

        if ($system === 'chinese') {
            return $signs[(($year - 4) % 12 + 12) % 12];
        }
        if ($system === 'japanese') {
            return $signs[(($year - 1900) % 9 + 9) % 9];
        }
        return $signs[0];
    }

    /** Знак по дате рождения (друиды, зороастрийский, цветочный) */
    public function signByDate(string $system, int $month, int $day): ?string
    {
        $signs = array_keys($this->systems()[$system]['signs'] ?? []);
        if (!$signs) return null;

        if ($system === 'druids') {
            $bounds = [
                ['birch', 1, 20], ['rowan', 2, 17], ['ash', 3, 17], ['alder', 4, 14],
                ['willow', 5, 12], ['hawthorn', 6, 9], ['oak', 7, 7], ['holly', 8, 4],
                ['hazel', 9, 1], ['vine', 9, 29], ['ivy', 10, 27], ['reed', 12, 31],
            ];
        } else {
            // зороастрийский и цветочный — границы как у зодиака
            $bounds = [
                ['cap', 1, 19], ['aqu', 2, 18], ['pis', 3, 20], ['ari', 4, 19],
                ['tau', 5, 20], ['gem', 6, 20], ['can', 7, 22], ['leo', 8, 22],
                ['vir', 9, 22], ['lib', 10, 22], ['sco', 11, 21], ['sag', 12, 21],
            ];
            // последний диапазон — до конца декабря
        }

        // Ищем знак: идём по границам "до какого дня"
        $order = array_keys($this->systems()[$system]['signs']);
        foreach ($bounds as $i => [$key, $m, $lastDay]) {
            $prevEnd = $i === 0 ? [12, 31] : [$bounds[$i - 1][1], $bounds[$i - 1][2]];
            $inRange = ($month === $prevEnd[0] && $day > $prevEnd[1])
                || ($month === $m && $day <= $lastDay)
                || ($month > $prevEnd[0] && $month < $m);
            if ($inRange && isset($order[$i])) {
                return $order[$i];
            }
        }
        // после последней границы — последний знак (для druids: reed до 12.31)
        return $order[count($order) - 1];
    }

    /** Готовый текст на дату (без генерации!) */
    public function get(string $system, string $sign, ?Carbon $date = null): ?FreeDailyHoroscope
    {
        return FreeDailyHoroscope::where('system', $system)
            ->where('sign', $sign)
            ->where('date', ($date ?? now())->toDateString())
            ->first();
    }
}
