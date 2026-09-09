<?php

namespace App\Filament\Admin\Resources\AdResource\Pages;

use App\Filament\Admin\Resources\AdResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAds extends ListRecords
{
    protected static string $resource = AdResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
