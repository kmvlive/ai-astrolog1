<?php

namespace App\Filament\Admin\Resources\DailyHoroscopeResource\Pages;

use App\Filament\Admin\Resources\DailyHoroscopeResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDailyHoroscopes extends ListRecords
{
    protected static string $resource = DailyHoroscopeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
