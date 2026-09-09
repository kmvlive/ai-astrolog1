<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DivinationResult extends Model {
    protected $guarded = [];
    protected $casts = ['created_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    protected static function booted(): void {
        static::creating(function ($m) {
            if (empty($m->uuid)) $m->uuid = (string) Str::uuid();
        });
    }
}
