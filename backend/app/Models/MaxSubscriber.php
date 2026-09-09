<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaxSubscriber extends Model
{
    protected $table = 'max_subscribers';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'username',
        'is_active',
        'horoscope_types',
        'email_enabled',
        'max_enabled',
        'last_activity_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'horoscope_types' => 'array',
        'email_enabled' => 'boolean',
        'max_enabled' => 'boolean',
        'last_activity_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
