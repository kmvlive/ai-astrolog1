<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class MagazineIssue extends Model
{
    protected $fillable = [
        'user_id',
        'issue_date',
        'uuid',
        'content',
        'sent_at',
    ];

    protected $casts = [
        'content' => 'array',
        'issue_date' => 'date',
        'sent_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($issue) {
            if (empty($issue->uuid)) {
                $issue->uuid = Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }
}
