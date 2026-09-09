<?php

namespace App\Filament\Admin\Resources\DeliveryLogResource\Pages;

use App\Filament\Admin\Resources\DeliveryLogResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDeliveryLogs extends ListRecords
{
    protected static string $resource = DeliveryLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
