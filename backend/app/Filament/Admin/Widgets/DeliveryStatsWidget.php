<?php

namespace App\Filament\Admin\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class DeliveryStatsWidget extends BaseWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        $sent = DB::table('delivery_logs')->where('event_type', 'personal_daily')->where('status', 'sent')->whereDate('created_at', today())->count();
        $failed = DB::table('delivery_logs')->where('event_type', 'personal_daily')->where('status', 'failed')->whereDate('created_at', today())->count();
        $generated = DB::table('horoscopes')->where('type', 'general')->where('is_personal', true)->whereDate('created_at', today())->count();
        $recipients = DB::table('users')->where('free_personal_enabled', true)->count();

        return [
            Stat::make('Писем сегодня', $sent)->description('персональные рассылки')->color('success'),
            Stat::make('Ошибок доставки', $failed)->description('за сегодня')->color($failed > 0 ? 'danger' : 'success'),
            Stat::make('Гороскопов создано', $generated)->description('персональных сегодня')->color('info'),
            Stat::make('Подписчиков', $recipients)->description('с персональным прогнозом')->color('warning'),
        ];
    }
}
