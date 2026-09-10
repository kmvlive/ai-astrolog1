<?php

namespace App\Filament\Admin\Resources\NameMeaningResource\Pages;

use App\Filament\Admin\Resources\NameMeaningResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListNameMeanings extends ListRecords
{
    protected static string $resource = NameMeaningResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
