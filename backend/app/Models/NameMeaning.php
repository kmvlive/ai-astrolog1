<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NameMeaning extends Model
{
    protected $fillable = ['name', 'translit', 'interpretation', 'views', 'ai_generated', 'approved'];
}
