<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Channel;

class ChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $channels = [
            [
                'name' => 'Email',
                'slug' => 'email',
                'description' => 'Получение гороскопов на электронную почту',
                'is_active' => true,
            ],
            [
                'name' => 'Telegram',
                'slug' => 'telegram',
                'description' => 'Получение гороскопов в Telegram боте',
                'is_active' => true,
            ],
            [
                'name' => 'MAX Messenger',
                'slug' => 'max',
                'description' => 'Получение гороскопов в MAX мессенджере',
                'is_active' => true,
            ],
        ];

        foreach ($channels as $channel) {
            Channel::firstOrCreate(['slug' => $channel['slug']], $channel);
        }
    }
}
