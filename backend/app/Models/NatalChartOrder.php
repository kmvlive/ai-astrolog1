<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NatalChartOrder extends Model
{
    protected $fillable = [
        'user_id', 'natal_chart_id', 'plan_id', 'type',
        'amount', 'status', 'tbank_payment_id',
        'weekly_horoscope_opt_in', 'payload',
    ];

    protected $casts = [
        'payload' => 'array',
        'weekly_horoscope_opt_in' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function natalChart(): BelongsTo
    {
        return $this->belongsTo(NatalChart::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
