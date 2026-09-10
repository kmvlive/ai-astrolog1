<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterMenuItem extends Model
{
    protected $fillable = ['title', 'url', 'sort_order', 'is_active', 'open_in_new_tab'];
    
    protected $casts = [
        'is_active' => 'boolean',
        'open_in_new_tab' => 'boolean',
    ];
}
