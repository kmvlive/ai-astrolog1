<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeneratedHoroscope extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'horoscope_type_id',
        'content',
        'natal_data',
        'generated_at',
    ];

    protected $casts = [
        'natal_data' => 'array',
        'generated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function horoscopeType(): BelongsTo
    {
        return $this->belongsTo(HoroscopeType::class);
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(DeliveryLog::class);
    }
}
