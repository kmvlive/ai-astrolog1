<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserChannel extends Model
{
    protected $table = 'user_channels';

    protected $fillable = ['user_id', 'channel_id', 'channel_identifier', 'is_verified'];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }
}
