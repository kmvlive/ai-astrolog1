<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FreeDailyHoroscope extends Model
{
    protected $fillable = ['date', 'system', 'sign', 'content'];

    protected $casts = ['date' => 'date'];
}
