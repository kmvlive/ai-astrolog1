<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Counter extends Model
{
    protected $fillable = ['name', 'type', 'code', 'raw_code', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];
}
