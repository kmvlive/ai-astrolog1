<?php

namespace App\Services;

use Carbon\Carbon;

class MoonPhase
{
    // Период синодического месяца в днях
    private const SYNODIC = 29.53058867;
    // Эталонное новолуние: 6 января 2000, 18:14 UTC
    private const KNOWN_NEW_MOON = 947182440;

    private int $idx;
    private int $illumination;
    private int $lunarDay;

    public static function forDate(Carbon $date): self
    {
        $instance = new self();

        $timestamp = $date->copy()->startOfDay()->setTimezone('UTC')->timestamp;
        $days = ($timestamp - self::KNOWN_NEW_MOON) / 86400;
        $phase = fmod(fmod($days, self::SYNODIC) + self::SYNODIC, self::SYNODIC);

        $instance->idx = (int) floor(($phase / self::SYNODIC) * 8 + 0.5) % 8;
        $instance->illumination = (int) round(
            ((1 - cos((2 * M_PI * $phase) / self::SYNODIC)) / 2) * 100
        );
        $instance->lunarDay = (int) floor($phase) + 1;

        return $instance;
    }

    public function toArray(): array
    {
        $phases = [
            ['name' => 'Новолуние',         'emoji' => '🌑', 'key' => 0, 'text' => 'Время новых начинаний и планирования.'],
            ['name' => 'Растущий серп',     'emoji' => '🌒', 'key' => 1, 'text' => 'Энергия прибывает. Время первых шагов к цели.'],
            ['name' => 'Первая четверть',   'emoji' => '🌓', 'key' => 2, 'text' => 'Луна набирает силу. Время активных действий.'],
            ['name' => 'Растущая Луна',     'emoji' => '🌔', 'key' => 3, 'text' => 'Энергия близка к пику. Завершайте начатое.'],
            ['name' => 'Полнолуние',        'emoji' => '🌕', 'key' => 4, 'text' => 'Пик энергии и эмоций. Максимальная интуиция.'],
            ['name' => 'Убывающая Луна',    'emoji' => '🌖', 'key' => 5, 'text' => 'Время делиться и завершать задачи.'],
            ['name' => 'Последняя четверть','emoji' => '🌗', 'key' => 6, 'text' => 'Энергия идёт на спад. Период анализа.'],
            ['name' => 'Убывающий серп',    'emoji' => '🌘', 'key' => 7, 'text' => 'Время тишины, отдыха и подведения итогов.'],
        ];

        $current = $phases[$this->idx];

        return [
            'idx' => $this->idx,
            'name' => $current['name'],
            'emoji' => $current['emoji'],
            'text' => $current['text'],
            'illumination' => $this->illumination,
            'lunarDay' => $this->lunarDay,
        ];
    }
}
