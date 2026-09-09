<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlansTableSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug' => 'week',
                'name' => 'Неделя',
                'price' => 9900,
                'original_price' => 19900,
                'duration_days' => 7,
                'sort_order' => 1,
                'features' => [
                    'Персональный гороскоп на неделю',
                    'Натальная карта',
                    'Базовая совместимость',
                    'Все каналы доставки',
                ],
            ],
            [
                'slug' => 'month',
                'name' => 'Месяц',
                'price' => 29900,
                'original_price' => 49900,
                'duration_days' => 30,
                'popular' => true,
                'sort_order' => 2,
                'features' => [
                    'Персональный гороскоп на месяц',
                    'Натальная карта',
                    'Прогноз совместимости',
                    'Все каналы доставки',
                    'Приоритетная поддержка',
                ],
            ],
            [
                'slug' => 'year',
                'name' => 'Год',
                'price' => 199900,
                'original_price' => 299900,
                'duration_days' => 365,
                'sort_order' => 3,
                'features' => [
                    'Персональный гороскоп на год',
                    'Натальная карта',
                    'Полный прогноз совместимости',
                    'Все каналы доставки',
                    'Приоритетная поддержка',
                    'Консультация астролога',
                ],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
