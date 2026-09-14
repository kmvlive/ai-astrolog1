<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NatalChart extends Model
{
    protected $fillable = [
        'user_id', 'birth_date', 'birth_time', 'gender',
        'city', 'latitude', 'longitude', 'chart_data',
        'interpretation', 'status', 'generated_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'chart_data' => 'array',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'generated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(NatalChartOrder::class);
    }
}
