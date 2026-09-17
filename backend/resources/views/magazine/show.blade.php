@extends('layouts.blog')

@section('title', 'Ваш журнал от ' . $issue->issue_date->translatedFormat('d F Y') . ' — AI Астролог')

@section('meta')
<meta property="og:type" content="article">
<meta property="og:title" content="Персональный журнал AI-астролога — {{ $issue->issue_date->translatedFormat('d.m.Y') }}">
<meta property="og:description" content="Ваш персональный выпуск журнала с гороскопом, аффирмацией, таро и биоритмами">
@endsection

@section('content')
<style>
.mag-container{max-width:780px;margin:0 auto;position:relative;z-index:2}

/* Masthead журнала */
.mag-masthead{text-align:center;margin-bottom:48px;padding:32px 0 24px;border-bottom:2px solid rgba(251,191,36,.4);position:relative}
.mag-masthead::before{content:"❖ ❖ ❖";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#020617;padding:0 16px;color:#fbbf24;font-size:12px;letter-spacing:8px}
.mag-title{font-family:'Playfair Display','Merriweather',serif;font-size:56px;font-weight:900;letter-spacing:-2px;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fbbf24 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;margin-bottom:4px;line-height:1}
.mag-subtitle{font-family:'Merriweather',serif;font-style:italic;font-size:15px;color:#a78bfa;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
.mag-meta{font-size:12px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase}
.mag-meta strong{color:#fbbf24}

/* Главная статья */
.mag-lead{background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(168,85,247,.06));border:1px solid rgba(251,191,36,.25);border-radius:24px;padding:40px 36px;margin-bottom:40px;position:relative;overflow:hidden}
.mag-lead::before{content:"";position:absolute;top:-50%;right:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(251,191,36,.12) 0%,transparent 60%);pointer-events:none}
.mag-lead-label{display:inline-block;padding:6px 16px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0f172a;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px}
.mag-lead h2{font-family:'Playfair Display','Merriweather',serif;font-size:32px;font-weight:700;margin-bottom:20px;color:#fff;line-height:1.25}
.mag-lead-body{font-size:17px;line-height:1.85;color:#e2e8f0;white-space:pre-line}
.mag-lead-body::first-letter{font-family:'Playfair Display',serif;font-size:64px;font-weight:700;float:left;line-height:0.9;margin:8px 12px 0 0;color:#fbbf24}

/* Блок-рубрика */
.mag-section{margin-bottom:32px}
.mag-section-head{display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(168,85,247,.25)}
.mag-section-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(236,72,153,.15));display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.mag-section-title{font-family:'Merriweather',serif;font-size:20px;font-weight:700;color:#fff;margin:0}
.mag-section-kicker{font-size:11px;color:#a78bfa;text-transform:uppercase;letter-spacing:2px;font-weight:700}

/* Аффирмация */
.mag-quote{font-family:'Playfair Display','Merriweather',serif;font-style:italic;font-size:22px;line-height:1.5;color:#fde68a;text-align:center;padding:24px;background:linear-gradient(135deg,rgba(251,191,36,.06),transparent);border-radius:20px;border-left:4px solid #fbbf24;position:relative}
.mag-quote::before,.mag-quote::after{content:"";position:absolute;font-size:48px;color:rgba(251,191,36,.3);font-family:Georgia,serif}
.mag-quote::before{content:"“";top:-10px;left:16px}
.mag-quote::after{content:"”";bottom:-30px;right:16px}

/* Таро */
.mag-tarot{display:flex;gap:24px;align-items:center;background:linear-gradient(135deg,rgba(168,85,247,.1),rgba(30,27,75,.4));border:1px solid rgba(168,85,247,.3);border-radius:20px;padding:24px}
.mag-tarot-card{width:110px;height:180px;background:linear-gradient(135deg,#4c1d95,#1e1b4b);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:64px;flex-shrink:0;box-shadow:0 10px 30px -10px rgba(168,85,247,.5);position:relative;overflow:hidden}
.mag-tarot-card::before{content:"";position:absolute;inset:4px;border:1px solid rgba(251,191,36,.4);border-radius:8px}
.mag-tarot-info h3{font-family:'Playfair Display',serif;font-size:26px;margin-bottom:8px;color:#fff}
.mag-tarot-info p{font-size:15px;line-height:1.7;color:#cbd5e1;font-style:italic}

/* Биоритмы */
.mag-bio{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.mag-bio-item{background:linear-gradient(135deg,rgba(15,23,42,.85),rgba(30,27,75,.4));border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:20px;text-align:center;position:relative;overflow:hidden}
.mag-bio-item::before{content:"";position:absolute;inset:0;border-radius:20px;padding:1px;background:linear-gradient(135deg,rgba(168,85,247,.4),transparent 50%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.6;pointer-events:none}
.mag-bio-label{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:8px}
.mag-bio-value{font-family:'Playfair Display',serif;font-size:44px;font-weight:700;line-height:1;margin-bottom:6px}
.mag-bio-value.pos{background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.mag-bio-value.neg{background:linear-gradient(135deg,#f87171,#ef4444);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.mag-bio-bar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;position:relative;margin-top:8px}
.mag-bio-bar-fill{position:absolute;top:0;height:100%;border-radius:3px;transition:width .8s}
.mag-bio-bar-center{position:absolute;top:0;left:50%;width:1px;height:100%;background:rgba(255,255,255,.2)}
.mag-bio-day{margin-top:20px;text-align:center;font-size:13px;color:#94a3b8;font-style:italic}

/* Ретроградные */
.mag-retro{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.mag-retro-item{background:rgba(30,41,59,.6);border:1px solid rgba(236,72,153,.25);border-radius:14px;padding:14px;text-align:center}
.mag-retro-item .planet{font-size:24px;margin-bottom:4px}
.mag-retro-item .name{font-size:13px;font-weight:600;color:#fff}
.mag-retro-item .status{font-size:11px;color:#f0abfc;margin-top:2px}

/* Блог */
.mag-blog{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mag-blog-item{background:linear-gradient(135deg,rgba(15,23,42,.85),rgba(30,27,75,.4));border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px;text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:all .3s}
.mag-blog-item:hover{transform:translateY(-3px);border-color:rgba(168,85,247,.5);text-decoration:none}
.mag-blog-cover{width:100%;aspect-ratio:16/9;border-radius:10px;background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(236,72,153,.15));display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden;margin-bottom:4px}
.mag-blog-cover img{width:100%;height:100%;object-fit:cover}
.mag-blog-date{font-size:11px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase}
.mag-blog-title{font-family:'Merriweather',serif;font-size:15px;font-weight:700;color:#fff;line-height:1.35}
.mag-blog-excerpt{font-size:12px;color:#cbd5e1;line-height:1.5}

/* Футер журнала */
.mag-footer{text-align:center;padding:40px 0 20px;margin-top:40px;border-top:2px solid rgba(251,191,36,.3);color:#94a3b8;font-size:13px;position:relative}
.mag-footer::before{content:"❖";position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#020617;padding:0 12px;color:#fbbf24;font-size:14px}
.mag-footer-cta{display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-radius:999px;font-weight:600;text-decoration:none;box-shadow:0 0 20px -4px rgba(168,85,247,.5)}
.mag-footer-cta:hover{color:#fff;text-decoration:none;box-shadow:0 0 30px -2px rgba(168,85,247,.7)}

@media(max-width:640px){
.mag-title{font-size:40px}
.mag-lead{padding:28px 20px}
.mag-lead h2{font-size:24px}
.mag-quote{font-size:18px;padding:20px}
.mag-tarot{flex-direction:column;text-align:center}
.mag-bio{grid-template-columns:1fr}
.mag-bio-value{font-size:36px}
.mag-blog{grid-template-columns:1fr}
}
</style>

<div class="mag-container">
    {{-- Masthead --}}
    <div class="mag-masthead">
        <div class="mag-subtitle">Персональный выпуск</div>
        <h1 class="mag-title">AI АСТРОЛОГ</h1>
        <div class="mag-meta">
            @if($issue->content['meta']['user_name'] ?? null)
                Для <strong>{{ $issue->content['meta']['user_name'] }}</strong> ·
            @endif
            {{ $issue->issue_date->translatedFormat('l, d F Y') }}
        </div>
    </div>

    {{-- Главная статья: гороскоп --}}
    @if($issue->content['horoscope'] ?? null)
        <article class="mag-lead">
            <span class="mag-lead-label">
                @if($issue->content['horoscope']['type'] === 'personal')
                    ⭐ Ваш персональный прогноз
                @elseif($issue->content['horoscope']['type'] === 'free_personal')
                    ⭐ Бесплатный персональный
                @else
                    ⭐ Гороскоп: {{ $issue->content['horoscope']['sign_name'] ?? 'ваш знак' }}
                @endif
            </span>
            <h2>
                @if($issue->content['horoscope']['horoscope_name'] ?? null)
                    {{ $issue->content['horoscope']['horoscope_name'] }}
                @else
                    Что говорят звёзды сегодня
                @endif
            </h2>
            <div class="mag-lead-body">{!! nl2br(e($issue->content['horoscope']['content'])) !!}</div>
        </article>
    @else
        <div class="mag-lead" style="text-align:center">
            <span class="mag-lead-label">⭐ Ваш день</span>
            <h2>Звёзды наблюдают за вами</h2>
            <div class="mag-lead-body" style="text-align:center">Персональный гороскоп появится, когда вы заполните данные рождения и закажете натальную карту.</div>
        </div>
    @endif

    {{-- Аффирмация дня --}}
    @if($issue->content['affirmation'] ?? null)
        <section class="mag-section">
            <div class="mag-section-head">
                <div class="mag-section-icon">💫</div>
                <div>
                    <div class="mag-section-kicker">Настрой дня</div>
                    <h3 class="mag-section-title">{{ $issue->content['affirmation']['title'] }}</h3>
                </div>
            </div>
            <div class="mag-quote">{{ $issue->content['affirmation']['description'] }}</div>
        </section>
    @endif

    {{-- Таро дня --}}
    @if($issue->content['tarot'] ?? null)
        <section class="mag-section">
            <div class="mag-section-head">
                <div class="mag-section-icon">🎴</div>
                <div>
                    <div class="mag-section-kicker">Карта дня</div>
                    <h3 class="mag-section-title">Послание Таро</h3>
                </div>
            </div>
            <div class="mag-tarot">
                <div class="mag-tarot-card">
                    @if($issue->content['tarot']['image'] ?? null)
                        <img src="{{ asset('storage/' . $issue->content['tarot']['image']) }}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px">
                    @else
                        🎴
                    @endif
                </div>
                <div class="mag-tarot-info">
                    <h3>{{ $issue->content['tarot']['name'] }}</h3>
                    <p>{{ $issue->content['tarot']['meaning_today'] }}</p>
                </div>
            </div>
        </section>
    @endif

    {{-- Биоритмы --}}
    @if($issue->content['biorhythms'] ?? null)
        @php $bio = $issue->content['biorhythms']; @endphp
        <section class="mag-section">
            <div class="mag-section-head">
                <div class="mag-section-icon">📊</div>
                <div>
                    <div class="mag-section-kicker">Ваш внутренний календарь</div>
                    <h3 class="mag-section-title">Биоритмы</h3>
                </div>
            </div>
            <div class="mag-bio">
                @foreach([
                    ['k' => 'physical', 'label' => 'Физический', 'period' => '23 дня', 'color' => '#34d399'],
                    ['k' => 'emotional', 'label' => 'Эмоциональный', 'period' => '28 дней', 'color' => '#f0abfc'],
                    ['k' => 'intellectual', 'label' => 'Интеллектуальный', 'period' => '33 дня', 'color' => '#60a5fa'],
                ] as $b)
                    @php $v = $bio[$b['k']]; @endphp
                    <div class="mag-bio-item">
                        <div class="mag-bio-label">{{ $b['label'] }}</div>
                        <div class="mag-bio-value {{ $v >= 0 ? 'pos' : 'neg' }}">{{ $v >= 0 ? '+' : '' }}{{ $v }}%</div>
                        <div class="mag-bio-bar">
                            <div class="mag-bio-bar-center"></div>
                            <div class="mag-bio-bar-fill" style="{{ $v >= 0 ? 'left:50%' : 'left:' . (50 + $v/2) . '%' }};width:{{ abs($v)/2 }}%;background:{{ $b['color'] }}"></div>
                        </div>
                        <div class="mag-bio-day" style="font-size:10px;margin-top:6px;color:#64748b">цикл {{ $b['period'] }}</div>
                    </div>
                @endforeach
            </div>
            <div class="mag-bio-day">День вашей жизни: <strong style="color:#fbbf24">{{ $bio['days_alive'] }}</strong></div>
        </section>
    @endif

    {{-- Ретроградные --}}
    @if(!empty($issue->content['retrograde']))
        <section class="mag-section">
            <div class="mag-section-head">
                <div class="mag-section-icon">☿</div>
                <div>
                    <div class="mag-section-kicker">Важный транзит</div>
                    <h3 class="mag-section-title">Ретроградные планеты</h3>
                </div>
            </div>
            <div class="mag-retro">
                @foreach($issue->content['retrograde'] as $p)
                    <div class="mag-retro-item">
                        <div class="planet">{{ $p['symbol'] ?? '☿' }}</div>
                        <div class="name">{{ $p['name'] ?? 'Планета' }}</div>
                        <div class="status">{{ $p['status'] ?? 'Ретро' }}</div>
                    </div>
                @endforeach
            </div>
        </section>
    @endif

    {{-- Блог --}}
    @if(!empty($issue->content['blog']))
        <section class="mag-section">
            <div class="mag-section-head">
                <div class="mag-section-icon">📖</div>
                <div>
                    <div class="mag-section-kicker">Обзор прессы</div>
                    <h3 class="mag-section-title">Свежие статьи блога</h3>
                </div>
            </div>
            <div class="mag-blog">
                @foreach($issue->content['blog'] as $post)
                    <a href="{{ $post['url'] }}" class="mag-blog-item">
                        <div class="mag-blog-cover">
                            @if($post['cover'] ?? null)
                                <img src="{{ asset('storage/' . $post['cover']) }}" alt="">
                            @else
                                ✨
                            @endif
                        </div>
                        <div class="mag-blog-date">{{ \Carbon\Carbon::parse($post['date'])->translatedFormat('d M') }}</div>
                        <div class="mag-blog-title">{{ $post['title'] }}</div>
                        @if($post['excerpt'] ?? null)
                            <div class="mag-blog-excerpt">{{ Str::limit($post['excerpt'], 100) }}</div>
                        @endif
                    </a>
                @endforeach
            </div>
        </section>
    @endif

    {{-- Футер журнала --}}
    <div class="mag-footer">
        <div>Ваш персональный журнал сгенерирован {{ \Carbon\Carbon::parse($issue->content['meta']['generated_at'])->translatedFormat('d F Y в H:i') }}</div>
        <div style="margin-top:8px;font-size:12px">© AI Астролог · my.neiro-astro.ru</div>
        <a href="/dashboard" class="mag-footer-cta">Перейти в личный кабинет →</a>
    </div>
</div>
@endsection
