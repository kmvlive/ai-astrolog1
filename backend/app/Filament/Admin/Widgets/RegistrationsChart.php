<?php

namespace App\Filament\Admin\Widgets;

use App\Models\User;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class RegistrationsChart extends ChartWidget
{
    protected static ?string $heading = 'Регистрации за 30 дней';
    protected static ?int $sort = 2;
    protected int | string | array $columnSpan = 'full';

    protected function getData(): array
    {
        $days = collect(range(29, 0))
            ->map(fn ($i) => now()->subDays($i)->format('Y-m-d'));

        $counts = User::whereBetween(
            'created_at',
            [now()->subDays(29)->startOfDay(), now()->endOfDay()]
        )
            ->get()
            ->groupBy(fn ($user) => $user->created_at->format('Y-m-d'))
            ->map(fn ($group) => $group->count());

        $total = $counts->sum();

        return [
            'datasets' => [
                [
                    'label' => 'Новые пользователи',
                    'data' => $days->map(fn ($day) => $counts[$day] ?? 0)->toArray(),
                    'borderColor' => 'rgb(245, 158, 11)',
                    'backgroundColor' => 'rgba(245, 158, 11, 0.15)',
                    'fill' => true,
                    'tension' => 0.4,
                    'pointRadius' => 3,
                    'pointBackgroundColor' => 'rgb(245, 158, 11)',
                ],
            ],
            'labels' => $days->map(fn ($day) => Carbon::parse($day)->format('d.m'))->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
