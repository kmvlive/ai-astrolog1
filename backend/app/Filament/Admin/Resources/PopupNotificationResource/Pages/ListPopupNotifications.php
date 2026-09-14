<?php
namespace App\Filament\Admin\Resources\PopupNotificationResource\Pages;

use App\Filament\Admin\Resources\PopupNotificationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPopupNotifications extends ListRecords
{
    protected static string $resource = PopupNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()->label('Новый popup')];
    }
}
