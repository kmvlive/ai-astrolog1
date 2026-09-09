<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DreamSymbol extends Model
{
    protected $fillable = ['keyword', 'interpretation', 'views', 'ai_generated', 'approved'];
}
