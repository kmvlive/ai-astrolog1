<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralCycle extends Model
{
    protected $fillable = [
        'user_id',
        'cycle_number',
        'referrals_count',
        'started_at',
        'ends_at',
        'months',
        'is_active',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ends_at' => 'datetime',
        'months' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('ends_at')->orWhere('ends_at', '>', now());
        });
    }

    public function isExpired(): bool
    {
        return $this->ends_at && $this->ends_at->isPast();
    }

    public function hasAccessToMonth(string $yearMonth): bool
    {
        if (!$this->is_active || $this->isExpired()) {
            return false;
        }
        return in_array($yearMonth, $this->months ?? []);
    }
}
