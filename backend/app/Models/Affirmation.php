<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Affirmation extends Model
{
    protected $fillable = ['date', 'title', 'description'];

    protected $casts = [
        'date' => 'date',
    ];

    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    public function scopeUpcoming($query, $days = 7)
    {
        return $query->where('date', '>=', now()->startOfDay())
                     ->where('date', '<=', now()->addDays($days)->endOfDay())
                     ->orderBy('date');
    }
}
