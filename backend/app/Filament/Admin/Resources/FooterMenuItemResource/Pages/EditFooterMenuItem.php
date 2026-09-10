<?php

namespace App\Filament\Admin\Resources\FooterMenuItemResource\Pages;

use App\Filament\Admin\Resources\FooterMenuItemResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditFooterMenuItem extends EditRecord
{
    protected static string $resource = FooterMenuItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
