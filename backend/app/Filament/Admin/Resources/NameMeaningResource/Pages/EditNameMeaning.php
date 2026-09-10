<?php

namespace App\Filament\Admin\Resources\NameMeaningResource\Pages;

use App\Filament\Admin\Resources\NameMeaningResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditNameMeaning extends EditRecord
{
    protected static string $resource = NameMeaningResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
