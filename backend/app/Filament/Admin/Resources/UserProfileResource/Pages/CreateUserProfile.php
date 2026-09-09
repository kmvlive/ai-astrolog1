<?php

namespace App\Filament\Admin\Resources\UserProfileResource\Pages;

use App\Filament\Admin\Resources\UserProfileResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

class CreateUserProfile extends CreateRecord
{
    protected static string $resource = UserProfileResource::class;
}
