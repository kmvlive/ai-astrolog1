<?php

namespace App\Filament\Admin\Resources\DailyHoroscopeResource\Pages;

use App\Filament\Admin\Resources\DailyHoroscopeResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditDailyHoroscope extends EditRecord
{
    protected static string $resource = DailyHoroscopeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
