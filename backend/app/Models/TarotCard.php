<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarotCard extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'meaning_today', 'image'];
    
    public static function cardOfTheDay(): self
    {
        // Используем дату как seed для стабильности в течение дня
        $seed = date('Ymd');
        mt_srand(crc32($seed));
        $cards = self::all();
        $card = $cards->isNotEmpty() ? $cards->random() : null;
        mt_srand(); // Восстанавливаем случайность
        return $card;
    }
}
