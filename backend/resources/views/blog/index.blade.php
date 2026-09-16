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
    <h1>{{ $category->name }}</h1>
    @if($category->parent)
        <a href="{{ route('blog.category', $category->parent) }}">← {{ $category->parent->name }}</a>
    @endif
</div>
@endif

@if($posts->isEmpty())
<div style="text-align:center;padding:80px 20px;position:relative;z-index:2">
    <div style="font-size:64px;margin-bottom:16px">📝</div>
    <h2>Пока нет публикаций{{ $category ? ' в разделе «' . $category->name . '»' : '' }}</h2>
    <p style="margin-top:8px;color:var(--muted)">
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
            <img src="{{ asset('storage/' . $post->cover_image) . '?v=' . (file_exists(storage_path('app/public/' . $post->cover_image)) ? filemtime(storage_path('app/public/' . $post->cover_image)) : time()) }}" alt="{{ $post->title }}" loading="lazy">
        @else
            @php $emoji = ['✨','🌙','⭐','🔮','💫','🌟'][crc32($post->slug) % 6]; @endphp
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
            <span>📅 {{ $post->published_at->translatedFormat('d M Y') }}</span>
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

@endsection
