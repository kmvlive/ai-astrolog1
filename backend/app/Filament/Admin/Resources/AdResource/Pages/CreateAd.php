<?php

namespace App\Filament\Admin\Resources\AdResource\Pages;

use App\Filament\Admin\Resources\AdResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Cache;

class CreateAd extends CreateRecord
{
    protected static string $resource = AdResource::class;

    protected function afterCreate(): void
    {
        Cache::forget('active_ads');
    }
}
