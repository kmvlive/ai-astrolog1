<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyHoroscope extends Model
{
    protected $fillable = ['date', 'zodiac_sign', 'type', 'period', 'content'];

    protected $casts = [
        'date' => 'date',
    ];
}
