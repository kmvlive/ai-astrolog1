<?php

namespace App\Filament\Admin\Resources\DeliveryLogResource\Pages;

use App\Filament\Admin\Resources\DeliveryLogResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditDeliveryLog extends EditRecord
{
    protected static string $resource = DeliveryLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
