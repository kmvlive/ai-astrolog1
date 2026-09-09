<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Calendar extends Model {
    protected $fillable = ['slug', 'name', 'emoji', 'description', 'is_active'];
    public function users(): BelongsToMany { return $this->belongsToMany(User::class); }
}
