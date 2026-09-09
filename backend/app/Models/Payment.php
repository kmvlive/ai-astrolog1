<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['user_id', 'plan_id', 'amount', 'status', 'tbank_payment_id', 'payload'];

    protected $casts = ['payload' => 'array', 'amount' => 'integer'];

    public function user() { return $this->belongsTo(User::class); }
    public function plan() { return $this->belongsTo(Plan::class); }
}
