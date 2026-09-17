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
.back-link{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;background:rgba(30,41,59,.5);border:1px solid rgba(255,255,255,.08);color:#cbd5e1;font-weight:500;font-size:14px;margin-bottom:32px;transition:all .3s;position:relative;z-index:2}
.back-link:hover{background:rgba(168,85,247,.15);border-color:rgba(168,85,247,.4);color:#fff;text-decoration:none;transform:translateX(-3px)}
.article{background:linear-gradient(135deg,rgba(15,23,42,.85),rgba(30,27,75,.4));border:1px solid rgba(255,255,255,.08);border-radius:28px;padding:48px;max-width:800px;margin:0 auto;position:relative;overflow:hidden;animation:article-in .6s cubic-bezier(.16,1,.3,1)}
.article::before{content:"";position:absolute;inset:0;border-radius:28px;padding:2px;background:linear-gradient(135deg,rgba(168,85,247,.5),rgba(236,72,153,.15) 40%,rgba(14,165,233,.3) 70%,rgba(168,85,247,.5));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.45;pointer-events:none;background-size:200% 200%;animation:blog-glow 3.5s ease-in-out infinite}
@keyframes article-in{from{transform:translateY(16px)}to{transform:none}}
.article h1{font-size:clamp(26px,4vw,38px);line-height:1.25;margin-bottom:24px;background:linear-gradient(135deg,#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.article-cover{width:100%;height:auto;border-radius:20px;margin-bottom:32px;box-shadow:0 20px 50px -15px rgba(168,85,247,.35),0 0 30px -5px rgba(236,72,153,.15);display:block}
.article-meta{display:flex;gap:12px;color:#94a3b8;font-size:13px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap;align-items:center}
.article-body{font-size:17px;line-height:1.85;color:#e2e8f0}
.article-body p{margin-bottom:1.3em}
.article-body h2{font-size:26px;margin:2em 0 .8em;background:linear-gradient(135deg,#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.article-body h3{font-size:21px;margin:1.6em 0 .6em;color:#f0abfc}
.article-body a{color:var(--accent);text-decoration:underline;text-decoration-color:rgba(168,85,247,.3);text-underline-offset:3px}
.article-body a:hover{text-decoration-color:var(--accent)}
.article-body blockquote{border-left:4px solid var(--accent);padding:16px 24px;margin:28px 0;background:linear-gradient(90deg,rgba(168,85,247,.1),transparent 80%);border-radius:0 16px 16px 0;font-style:italic;color:#c4b5fd}
.article-body strong{color:#fff;font-weight:700}
.article-body code{background:rgba(30,41,59,.8);padding:2px 8px;border-radius:6px;font-size:.9em;color:#f0abfc;border:1px solid rgba(255,255,255,.06)}
.article-body pre{background:rgba(2,6,23,.9);padding:20px;border-radius:16px;overflow-x:auto;margin:1.5em 0;border:1px solid rgba(255,255,255,.06)}
.article-body pre code{background:none;padding:0;border:none;color:#e2e8f0}
.article-body ul,.article-body ol{margin:1em 0 1.3em 1.5em}
.article-body li{margin-bottom:.5em}
.share{margin-top:48px;padding-top:28px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.share-title{font-weight:600;font-size:14px;color:#94a3b8}
.share-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;color:#fff!important;text-decoration:none!important;border:none;cursor:pointer;transition:all .25s}
.share-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px -5px currentColor}
.tg{background:#229ed9;color:#fff}.vk{background:#0077ff;color:#fff}.wa{background:#25d366;color:#fff}.ok{background:#f90;color:#fff}.copy{background:#6b7280;color:#fff}
.related{margin-top:64px;position:relative;z-index:2}
.related h2{margin-bottom:24px;background:linear-gradient(135deg,#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-size:28px}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
@media(max-width:640px){.article{padding:28px 20px;border-radius:20px}.article h1{font-size:24px}}
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

<a href="{{ route('blog.index') }}" class="back-link">← Все статьи</a>
<article class="article">
    <div class="article-meta">
        <span class="badge {{ $post->author_type === 'ai' ? 'badge-ai' : 'badge-human' }}">
            {{ $post->author_type === 'ai' ? '🤖 AI-астролог' : '👤 ' . $post->author_name }}
        </span>
        <span>📅 {{ $post->published_at->translatedFormat('d F Y') }}</span>
        <span>👁 {{ $post->views_count }} просмотров</span>
    </div>
    @if($post->cover_image)
        <img class="article-cover" src="{{ asset('storage/' . $post->cover_image) . '?v=' . $post->updated_at->timestamp }}" alt="{{ $post->title }}">
    @endif
    <h1>{{ $post->title }}</h1>
    <div class="article-body">{!! \Illuminate\Support\Str::markdown($post->content) !!}</div>
    <div class="share">
        <span class="share-title">Поделиться:</span>
        <a target="_blank" rel="noopener" href="https://t.me/share/url?url={{ urlencode(url()->current()) }}&text={{ urlencode($post->title) }}" class="share-btn tg">✈️ Telegram</a>
        <a target="_blank" rel="noopener" href="https://vk.com/share.php?url={{ urlencode(url()->current()) }}" class="share-btn vk">ВКонтакте</a>
        <a target="_blank" rel="noopener" href="https://wa.me/?text={{ urlencode($post->title . ' ' . url()->current()) }}" class="share-btn wa">WhatsApp</a>
        <a target="_blank" rel="noopener" href="https://connect.ok.ru/offer?url={{ urlencode(url()->current()) }}" class="share-btn ok">Одноклассники</a>
        <button class="share-btn copy" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✓ Скопировано';setTimeout(()=>this.textContent='📋 Копировать',1500)">📋 Копировать</button>
    </div>
</article>

@if(!empty($related) && $related->count())
<div class="related">
    <h2>Читайте также</h2>
    <div class="posts related-grid">
        @foreach($related as $post)
        <article class="post">
            <div class="post-cover">
                @if($post->cover_image)
                    <img src="{{ asset('storage/' . $post->cover_image) }}" alt="{{ $post->title }}" loading="lazy">
                @else
                    @php $emoji = ['✨','🌙','⭐','🔮','💫','🌟'][crc32($post->slug) % 6]; @endphp
                    {{ $emoji }}
                @endif
            </div>
            <div class="post-body">
                <div class="post-meta">
                    <span class="badge {{ $post->author_type === 'ai' ? 'badge-ai' : 'badge-human' }}">
                        {{ $post->author_type === 'ai' ? '🤖 AI' : '👤 Редактор' }}
                    </span>
                    <span>👁 {{ $post->views_count }}</span>
                </div>
                <h3><a href="{{ route('blog.show', $post) }}">{{ $post->title }}</a></h3>
                <a href="{{ route('blog.show', $post) }}" class="read-more">Читать →</a>
            </div>
        </article>
        @endforeach
    </div>
</div>
@endif

@endsection
