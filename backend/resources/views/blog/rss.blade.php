{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>Блог AI-астролога</title>
<link>{{ url('/blog') }}</link>
<atom:link href="{{ url('/blog/rss') }}" rel="self" type="application/rss+xml"/>
<description>Ежедневные прогнозы, разборы энергий дня и профессиональные советы от AI-астролога</description>
<language>ru</language>
<lastBuildDate>{{ now()->toRssString() }}</lastBuildDate>
@foreach($posts as $p)
<item>
<title>{{ $p->title }}</title>
<link>{{ route('blog.show', $p) }}</link>
<guid isPermaLink="true">{{ route('blog.show', $p) }}</guid>
<pubDate>{{ $p->published_at->toRssString() }}</pubDate>
<description><![CDATA[<img src="{{ $p->cover_image ? asset('storage/' . $p->cover_image) : '' }}" alt="{{ $p->title }}" /><p>{{ mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags(\Illuminate\Support\Str::markdown($p->content)))), 0, 900) }}…</p><a href="{{ route('blog.show', $p) }}">Читать далее →</a>]]></description>
<content:encoded><![CDATA[<img src="{{ $p->cover_image ? asset('storage/' . $p->cover_image) : '' }}" alt="{{ $p->title }}" /><p>{{ mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags(\Illuminate\Support\Str::markdown($p->content)))), 0, 900) }}…</p><a href="{{ route('blog.show', $p) }}">Читать далее →</a>]]></content:encoded>
@if($p->cover_image)
<media:content url="{{ asset('storage/' . $p->cover_image) }}" medium="image" type="image/jpeg" width="1200" height="800"/>
<media:thumbnail url="{{ asset('storage/' . $p->cover_image) }}"/>
<enclosure url="{{ asset('storage/' . $p->cover_image) }}" length="{{ \Illuminate\Support\Facades\Storage::disk('public')->size($p->cover_image) }}" type="image/jpeg"/>
@endif
</item>
@endforeach
</channel>
</rss>
