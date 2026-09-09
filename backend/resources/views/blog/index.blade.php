@extends('layouts.blog')
@section('title', 'Блог AI-астролога')
@section('content')
@if($posts->isEmpty())
<div style="text-align:center;padding:80px 20px;color:var(--muted)">
<div style="font-size:64px;margin-bottom:16px">📝</div>
<h2 style="font-family:'Merriweather',serif">Пока нет публикаций</h2>
<p style="margin-top:8px">Первая ИИ-статья появится завтра в 7:00</p>
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
@endsection
