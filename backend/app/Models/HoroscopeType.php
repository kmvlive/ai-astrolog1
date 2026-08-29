<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HoroscopeType extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'price', 'periodicity', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_horoscope_types');
    }
}
