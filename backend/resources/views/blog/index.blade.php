@extends('layouts.blog')
@section('title', $category ? $category->name . ' — Блог AI-астролога' : 'Блог AI-астролога')
@section('content')

@if(!$posts->isEmpty() && count($categories) > 0)
<nav class="cat-menu">
    <a href="{{ route('blog.index') }}" class="cat-chip {{ !$category ? 'active' : '' }}">Все статьи</a>
    @foreach($categories as $cat)
        <a href="{{ route('blog.category', $cat) }}" class="cat-chip {{ $category && $category->id === $cat->id ? 'active' : '' }}">{{ $cat->name }}</a>
        @if($cat->children->count())
            @foreach($cat->children as $child)
                <a href="{{ route('blog.category', $child) }}" class="cat-chip sub {{ $category && $category->id === $child->id ? 'active' : '' }}">↳ {{ $child->name }}</a>
            @endforeach
        @endif
    @endforeach
</nav>
@endif

@if($category)
<div class="cat-header">
    <h1 style="font-family:'Merriweather',serif;font-size:28px;margin-bottom:4px">{{ $category->name }}</h1>
    @if($category->parent)
        <a href="{{ route('blog.category', $category->parent) }}" style="color:var(--muted);font-size:14px">← {{ $category->parent->name }}</a>
    @endif
</div>
@endif

@if($posts->isEmpty())
<div style="text-align:center;padding:80px 20px;color:var(--muted)">
<div style="font-size:64px;margin-bottom:16px">📝</div>
<h2 style="font-family:'Merriweather',serif">Пока нет публикаций{{ $category ? ' в разделе «' . $category->name . '»' : '' }}</h2>
<p style="margin-top:8px">
    @if($category)
        <a href="{{ route('blog.index') }}">Смотреть все статьи →</a>
    @else
        Первая ИИ-статья появится завтра в 7:00
    @endif
</p>
</div>
@else
<div class="posts">
@foreach($posts as $post)
<article class="post">
<div class="post-cover">
@if($post->cover_image)
<img src="{{ asset('storage/' . $post->cover_image) . '?v=' . (file_exists(storage_path('app/public/' . $post->cover_image)) ? filemtime(storage_path('app/public/' . $post->cover_image)) : time()) }}" alt="{{ $post->title }}" loading="lazy" style="width:100%;height:auto;display:block">
@else
@php $emoji = ['✨','🌙','⭐','🔮','️','💫'][crc32($post->slug) % 6]; @endphp
{{ $emoji }}
@endif
</div>
<div class="post-body">
<div class="post-meta">
<span class="badge {{ $post->author_type === 'ai' ? 'badge-ai' : 'badge-human' }}">
{{ $post->author_type === 'ai' ? '🤖 AI-астролог' : '👤 Редактор' }}
</span>
@if($post->category)
<a href="{{ route('blog.category', $post->category) }}" class="badge badge-cat">{{ $post->category->name }}</a>
@endif
<span>{{ $post->published_at->translatedFormat('d M Y') }}</span>
<span>👁 {{ $post->views_count }}</span>
</div>
<h3><a href="{{ route('blog.show', $post) }}">{{ $post->title }}</a></h3>
<p class="post-excerpt">{{ $post->excerpt ?? mb_substr(strip_tags($post->content), 0, 140) . '…' }}</p>
<a href="{{ route('blog.show', $post) }}" class="read-more">Читать →</a>
</div>
</article>
@endforeach
</div>
<div class="pagination">{{ $posts->links() }}</div>
@endif

<style>
.cat-menu{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 32px;padding:24px;background:var(--surface);border-radius:20px;border:1px solid var(--border)}
.cat-chip{padding:8px 16px;background:#f3f4f6;border-radius:999px;font-size:14px;font-weight:500;color:var(--text);text-decoration:none;transition:all .2s;border:1px solid transparent}
.cat-chip:hover{background:#ede9fe;color:var(--primary);text-decoration:none}
.cat-chip.active{background:var(--primary);color:#fff;font-weight:600}
.cat-chip.sub{background:transparent;border:1px dashed var(--border);font-size:13px;padding:6px 14px}
.cat-chip.sub.active{border-color:var(--primary);border-style:solid}
.cat-header{max-width:1100px;margin:0 auto 24px;padding:0 24px}
.badge-cat{background:#ede9fe !important;color:var(--primary) !important;border:1px solid #c4b5fd !important}
.badge-cat:hover{background:#ddd6fe !important;text-decoration:none}
</style>
@endsection
