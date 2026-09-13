<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $fillable = [
        'title', 'slug', 'excerpt', 'content', 'author_type', 'author_name',
        'cover_image', 'published_at', 'seo_title', 'seo_description', 'views_count',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function scopePublished($query) {
        return $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function getRouteKeyName(): string {
        return 'slug';
    }
}

    public function category()
    {
        return $this->belongsTo(\App\Models\BlogCategory::class, 'blog_category_id');
    }
