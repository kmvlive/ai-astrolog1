<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_type',
        'recipient_email',
        'subject',
        'metadata',
        'user_id',
        'channel_id',
        'generated_horoscope_id',
        'status',
        'attempts',
        'last_retry_at',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'sent_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    public function generatedHoroscope(): BelongsTo
    {
        return $this->belongsTo(GeneratedHoroscope::class);
    }
}
