<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PopupNotification extends Model
{
    protected $fillable = [
        'title', 'body', 'icon', 'link_url', 'link_text', 'dismiss_text',
        'type', 'is_active', 'show_once', 'starts_at', 'ends_at', 'priority',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_once' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            });
    }

    public function scopeOrdered($query)
    {
        return $query->orderByDesc('priority')->orderByDesc('created_at');
    }
}
