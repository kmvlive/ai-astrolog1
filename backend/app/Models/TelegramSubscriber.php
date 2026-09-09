<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelegramSubscriber extends Model
{
    protected $fillable = [
        'user_id', 'chat_id', 'username', 'first_name',
        'horoscope_types', 'is_active', 'last_sent_at',
    ];

    protected $casts = [
        'horoscope_types' => 'array',
        'is_active' => 'boolean',
        'last_sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
