<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\BlogCategory;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request, ?BlogCategory $category = null) {
        $categories = BlogCategory::active()->roots()->with('children')->get();

        $query = BlogPost::published()->with('category');
        if ($category) {
            $ids = $category->children()->pluck('id')->push($category->id)->unique();
            $query->whereIn('blog_category_id', $ids);
        }
        $posts = $query->orderByDesc('published_at')->paginate(12)->withQueryString();

        return view('blog.index', compact('posts', 'categories', 'category'));
    }

    public function rss()
    {
        $posts = BlogPost::published()->orderByDesc('published_at')->take(20)->get();
        $xml = view('blog.rss', ['posts' => $posts])->render();
        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    public function show(BlogPost $post) {
        if (!$post->published_at || $post->published_at->isFuture()) {
            abort(404);
        }
        $post->increment('views_count');
        $related = BlogPost::published()->where('id', '!=', $post->id)->orderByDesc('published_at')->take(3)->get();
        return view('blog.show', compact('post', 'related'));
    }
}
