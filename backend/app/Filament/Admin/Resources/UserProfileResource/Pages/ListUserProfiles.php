<?php

namespace App\Filament\Admin\Resources\UserProfileResource\Pages;

use App\Filament\Admin\Resources\UserProfileResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListUserProfiles extends ListRecords
{
    protected static string $resource = UserProfileResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
