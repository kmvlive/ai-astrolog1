<?php

namespace App\Filament\Admin\Resources\AdResource\Pages;

use App\Filament\Admin\Resources\AdResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Cache;

class EditAd extends EditRecord
{
    protected static string $resource = AdResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function afterSave(): void
    {
        Cache::forget('active_ads');
    }
}
