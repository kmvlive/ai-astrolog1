<?php

namespace App\Filament\Admin\Resources\CounterResource\Pages;

use App\Filament\Admin\Resources\CounterResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCounter extends CreateRecord
{
    protected static string $resource = CounterResource::class;
}
