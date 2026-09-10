<?php

namespace App\Filament\Admin\Resources\FooterMenuItemResource\Pages;

use App\Filament\Admin\Resources\FooterMenuItemResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListFooterMenuItems extends ListRecords
{
    protected static string $resource = FooterMenuItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
