<?php

namespace App\Filament\Admin\Widgets;

use App\Models\UserProfile;
use Filament\Widgets\ChartWidget;

class HoroscopeTypesChart extends ChartWidget
{
    protected static ?string $heading = 'Типы гороскопов у пользователей';
    protected static ?int $sort = 3;

    protected function getData(): array
    {
        $stats = UserProfile::selectRaw('daily_horoscope_type, count(*) as total')
            ->groupBy('daily_horoscope_type')
            ->pluck('total', 'daily_horoscope_type');

        $labels = [
            'daily' => 'Ежедневный',
            'weekly' => 'Еженедельный',
            'monthly' => 'Ежемесячный',
        ];

        return [
            'datasets' => [
                [
                    'label' => 'Пользователи',
                    'data' => $stats->values()->toArray(),
                    'backgroundColor' => [
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                    ],
                ],
            ],
            'labels' => $stats->keys()->map(fn ($key) => $labels[$key] ?? $key)->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }
}
