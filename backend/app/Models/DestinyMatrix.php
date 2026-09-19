<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DestinyMatrix extends Model
{
    protected $fillable = ['user_id', 'birth_date', 'positions', 'interpretation', 'uuid'];

    protected $casts = [
        'positions' => 'array',
        'birth_date' => 'date:Y-m-d',
    ];
}
