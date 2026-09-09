<?php

namespace App\Filament\Admin\Resources\CounterResource\Pages;

use App\Filament\Admin\Resources\CounterResource;
use Filament\Resources\Pages\EditRecord;

class EditCounter extends EditRecord
{
    protected static string $resource = CounterResource::class;
}
