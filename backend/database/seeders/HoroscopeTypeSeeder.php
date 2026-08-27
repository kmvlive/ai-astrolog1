<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HoroscopeType;

class HoroscopeTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'Дневной гороскоп',
                'slug' => 'daily',
                'description' => 'Персональный прогноз на сегодня',
                'price' => 0,
                'periodicity' => 'daily',
                'is_active' => true,
            ],
            [
                'name' => 'Недельный гороскоп',
                'slug' => 'weekly',
                'description' => 'Прогноз на предстоящую неделю',
                'price' => 0,
                'periodicity' => 'weekly',
                'is_active' => true,
            ],
            [
                'name' => 'Месячный гороскоп',
                'slug' => 'monthly',
                'description' => 'Общий прогноз на месяц',
                'price' => 0,
                'periodicity' => 'monthly',
                'is_active' => true,
            ],
            [
                'name' => 'Годовой гороскоп',
                'slug' => 'yearly',
                'description' => 'Персональный прогноз на год',
                'price' => 0,
                'periodicity' => 'yearly',
                'is_active' => true,
            ],
            [
                'name' => 'Любовный гороскоп',
                'slug' => 'love',
                'description' => 'Прогноз для отношений и любви',
                'price' => 0,
                'periodicity' => 'weekly',
                'is_active' => true,
            ],
            [
                'name' => 'Финансовый гороскоп',
                'slug' => 'finance',
                'description' => 'Прогноз для денег и карьеры',
                'price' => 0,
                'periodicity' => 'weekly',
                'is_active' => true,
            ],
            [
                'name' => 'Гороскоп совместимости',
                'slug' => 'compatibility',
                'description' => 'Совместимость с партнёром',
                'price' => 0,
                'periodicity' => 'once',
                'is_active' => true,
            ],
            [
                'name' => 'Натальная карта',
                'slug' => 'natal',
                'description' => 'Полная натальная карта с интерпретацией',
                'price' => 0,
                'periodicity' => 'once',
                'is_active' => true,
            ],
        ];

        foreach ($types as $type) {
            HoroscopeType::firstOrCreate(['slug' => $type['slug']], $type);
        }
    }
}
