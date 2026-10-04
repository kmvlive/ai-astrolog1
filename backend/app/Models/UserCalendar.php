<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCalendar extends Model
{
    protected $table = 'user_calendars';

    protected $fillable = ['user_id', 'name', 'color', 'is_default'];

    protected $casts = ['is_default' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function events()
    {
        return $this->hasMany(CalendarEvent::class, 'calendar_id');
    }
}
