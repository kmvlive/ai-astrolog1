<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'slug', 'name', 'price', 'original_price', 'duration_days',
        'features', 'active', 'popular', 'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'active' => 'boolean',
        'popular' => 'boolean',
        'price' => 'integer',
        'original_price' => 'integer',
        'duration_days' => 'integer',
    ];

    public function getPriceRubAttribute(): float
    {
        return $this->price / 100;
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price / 100, 0, ',', ' ') . ' ₽';
    }

    public function getFormattedOriginalPriceAttribute(): ?string
    {
        return $this->original_price ? number_format($this->original_price / 100, 0, ',', ' ') . ' ₽' : null;
    }
}
