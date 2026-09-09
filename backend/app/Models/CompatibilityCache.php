<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompatibilityCache extends Model
{
    protected $table = 'compatibility_cache';

    protected $fillable = ['sign1', 'sign2', 'content'];
}
