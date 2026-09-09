<?php

namespace App\Filament\Admin\Widgets;

use App\Models\User;
use Filament\Widgets\ChartWidget;

class EmailVerificationChart extends ChartWidget
{
    protected static ?string $heading = 'Статус email пользователей';
    protected static ?int $sort = 4;

    protected function getData(): array
    {
        $verified = User::whereNotNull('email_verified_at')->count();
        $unverifiedWithOptIn = User::whereNull('email_verified_at')
            ->where('email_opt_in', true)->count();
        $noOptIn = User::where('email_opt_in', false)->count();

        return [
            'datasets' => [
                [
                    'label' => 'Пользователи',
                    'data' => [$verified, $unverifiedWithOptIn, $noOptIn],
                    'backgroundColor' => [
                        'rgba(16, 185, 129, 0.8)',  // зелёный - верифицированы
                        'rgba(245, 158, 11, 0.8)',  // янтарный - ждут подтверждения
                        'rgba(148, 163, 184, 0.6)', // серый - отказались
                    ],
                ],
            ],
            'labels' => [
                "Подтвердили ({$verified})",
                "Ждут подтверждения ({$unverifiedWithOptIn})",
                "Без рассылки ({$noOptIn})",
            ],
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }
}
