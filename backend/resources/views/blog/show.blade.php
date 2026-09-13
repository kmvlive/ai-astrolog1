@extends('layouts.blog')
@section('title', $post->seo_title ?: ($post->title . ' — Блог AI-астролога'))
@section('description', $post->seo_description ?: $post->excerpt)
@section('meta')
<meta property="og:type" content="article">
<meta property="og:url" content="{{ route('blog.show', $post) }}">
<link rel="canonical" href="{{ route('blog.show', $post) }}">
<meta property="og:title" content="{{ $post->title }}">
<meta property="og:description" content="{{ $post->seo_description ?: $post->excerpt }}">
@if($post->cover_image)<meta property="og:image" content="{{ asset('storage/' . $post->cover_image) . '?v=' . $post->updated_at->timestamp }}">@endif
<meta property="article:published_time" content="{{ $post->published_at->toIso8601String() }}">
<meta property="article:author" content="{{ $post->author_name ?: 'AI-астролог' }}">
<script type="application/ld+json">
{!! json_encode([
'@context' => 'https://schema.org',
'@type' => 'Article',
'headline' => $post->title,
'datePublished' => $post->published_at->toIso8601String(),
'author' => ['@type' => 'Person', 'name' => $post->author_name ?: 'AI-астролог'],
'publisher' => ['@type' => 'Organization', 'name' => 'AI Астролог'],
]) !!}
</script>
@endsection

@section('content')
<style>
.article{background:var(--surface);border-radius:16px;padding:48px;box-shadow:0 4px 20px rgba(109,40,217,.08);max-width:800px;margin:0 auto}
.article h1{font-size:36px;line-height:1.25;margin-bottom:16px}
.article-cover{width:100%;height:auto;border-radius:12px;margin-bottom:28px;box-shadow:0 8px 30px rgba(109,40,217,.2)}
.article-meta{display:flex;gap:16px;color:var(--muted);font-size:14px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.article-body{font-size:17px;line-height:1.8}
.article-body p{margin-bottom:1.2em}
.article-body h2{font-size:26px;margin:2em 0 .8em}
.article-body h3{font-size:21px;margin:1.6em 0 .6em}
.article-body blockquote{border-left:4px solid var(--primary-light);padding:12px 20px;margin:24px 0;background:#f5f3ff;border-radius:0 8px 8px 0;font-style:italic;color:#4c1d95}
.article-body strong{color:var(--primary);font-weight:600}
.article-body ul,.article-body ol{margin:1em 0 1.2em 1.5em}
.article-body li{margin-bottom:.5em}
.back{display:inline-block;margin-bottom:24px;font-weight:500}
.share{margin-top:40px;padding-top:24px;border-top:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.share-title{font-weight:600;font-size:14px;color:var(--muted)}
.share-btn{padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;color:#fff;text-decoration:none!important;border:none;cursor:pointer;transition:transform .15s}
.share-btn:hover{transform:scale(1.05);color:#fff}
.tg{background:#229ed9}.vk{background:#0077ff}.wa{background:#25d366}.ok{background:#f90}.copy{background:#6b7280}
.related{margin-top:64px}
.related h2{margin-bottom:24px}
@media(max-width:640px){.article{padding:28px 20px}.article h1{font-size:26px}}
</style>

@if(count($categories) > 0)
<nav class="cat-menu" style="margin-bottom:24px">
    <a href="{{ route('blog.index') }}" class="cat-chip {{ !$post->category ? 'active' : '' }}">Все статьи</a>
    @foreach($categories as $cat)
        <a href="{{ route('blog.category', $cat) }}" class="cat-chip {{ $post->category && ($post->category->id === $cat->id || $post->category->parent_id === $cat->id) ? 'active' : '' }}">{{ $cat->name }}</a>
        @if($cat->children->count())
            @foreach($cat->children as $child)
                <a href="{{ route('blog.category', $child) }}" class="cat-chip sub {{ $post->category && $post->category->id === $child->id ? 'active' : '' }}">↳ {{ $child->name }}</a>
            @endforeach
        @endif
    @endforeach
</nav>
@endif

<a href="{{ route('blog.index') }}" class="back">← Все статьи</a>
<article class="article">
<div class="article-meta">
<span class="badge {{ $post->author_type === 'ai' ? 'badge-ai' : 'badge-human' }}">
{{ $post->author_type === 'ai' ? '🤖 AI-астролог' : '👤 ' . $post->author_name }}
</span>
<span>📅 {{ $post->published_at->translatedFormat('d F Y') }}</span>
<span>👁 {{ $post->views_count }} просмотров</span>
</div>
@if($post->cover_image)
<img class="article-cover" src="{{ asset('storage/' . $post->cover_image) . '?v=' . $post->updated_at->timestamp }}" alt="{{ $post->title }}" style="width:100%;height:auto;border-radius:12px;margin-bottom:28px;display:block">
@endif
<h1>{{ $post->title }}</h1>
<div class="article-body">{!! \Illuminate\Support\Str::markdown($post->content) !!}</div>
<div class="share">
<span class="share-title">Поделиться:</span>
<a target="_blank" rel="noopener" href="https://t.me/share/url?url={{ urlencode(url()->current()) }}&text={{ urlencode($post->title) }}" class="share-btn tg">✈️ Telegram</a>
<a target="_blank" rel="noopener" href="https://vk.com/share.php?url={{ urlencode(url()->current()) }}" class="share-btn vk">VK</a>
<a target="_blank" rel="noopener" href="https://wa.me/?text={{ urlencode($post->title . ' — ' . url()->current()) }}" class="share-btn wa">WhatsApp</a>
<a target="_blank" rel="noopener" href="https://connect.ok.ru/offer?url={{ urlencode(url()->current()) }}" class="share-btn ok">OK</a>
<button class="share-btn copy" onclick="navigator.clipboard.writeText('{{ url()->current() }}');this.innerText='✓ Скопировано!'">🔗 Копировать</button>
</div>
</article>

@if($related->isNotEmpty())
<section class="related">
<h2>Читайте также</h2>
<div class="posts">
@foreach($related as $r)
<article class="post">
<div class="post-body">
<div class="post-meta"><span>{{ $r->published_at->translatedFormat('d M Y') }}</span></div>
<h3><a href="{{ route('blog.show', $r) }}">{{ $r->title }}</a></h3>
</div>
</article>
@endforeach
</div>
</section>
@endif
@endsection
