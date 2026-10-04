<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    protected $table = 'calendar_events';

    protected $fillable = [
        'calendar_id', 'user_id', 'title', 'description',
        'start_at', 'end_at', 'all_day', 'location', 'color', 'reminder_enabled',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'all_day' => 'boolean',
        'reminder_enabled' => 'boolean',
    ];

    public function calendar()
    {
        return $this->belongsTo(UserCalendar::class, 'calendar_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
