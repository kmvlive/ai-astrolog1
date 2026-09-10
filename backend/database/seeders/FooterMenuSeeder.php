<?php

namespace Database\Seeders;

use App\Models\FooterMenuItem;
use Illuminate\Database\Seeder;

class FooterMenuSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['title' => 'Главная', 'url' => '/', 'sort_order' => 1],
            ['title' => 'Гороскопы', 'url' => '/horoscopes', 'sort_order' => 2],
            ['title' => 'Календари', 'url' => '/calendars', 'sort_order' => 3],
            ['title' => 'Значение имён', 'url' => '/names', 'sort_order' => 4],
            ['title' => 'Сонник', 'url' => '/dreams', 'sort_order' => 5],
            ['title' => 'Личный кабинет', 'url' => '/dashboard', 'sort_order' => 6],
            ['title' => 'Условия оказания услуг', 'url' => '/terms', 'sort_order' => 7],
        ];

        foreach ($items as $item) {
            FooterMenuItem::create($item);
        }
    }
}
