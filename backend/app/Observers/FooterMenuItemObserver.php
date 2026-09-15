<?php

namespace App\Observers;

use App\Models\FooterMenuItem;
use Illuminate\Support\Facades\Cache;

class FooterMenuItemObserver
{
    public function created(FooterMenuItem $item): void
    {
        Cache::forget('footer_menu');
    }

    public function updated(FooterMenuItem $item): void
    {
        Cache::forget('footer_menu');
    }

    public function deleted(FooterMenuItem $item): void
    {
        Cache::forget('footer_menu');
    }
}
