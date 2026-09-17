@extends('layouts.blog')

@section('title', 'Ваш журнал от ' . $issue->issue_date->translatedFormat('d F Y') . ' — AI Астролог')

@section('meta')
<meta property="og:type" content="article">
<meta property="og:title" content="Персональный журнал AI-астролога — {{ $issue->issue_date->translatedFormat('d.m.Y') }}">
<meta property="og:description" content="Ваш персональный выпуск журнала с гороскопом, аффирмацией, таро и биоритмами">
@endsection

@section('content')
<style>
/* === JOURNAL LAYOUT === */
.journal-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;
    position: relative;
}

/* Мелкий шрифт "номер выпуска" вверху */
.journal-masthead-small {
    text-align: center;
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 8px;
}

/* Главный заголовок журнала */
.journal-masthead {
    text-align: center;
    padding: 20px 0 30px;
    border-top: 3px double #fbbf24;
    border-bottom: 1px solid rgba(251, 191, 36, 0.3);
    margin-bottom: 40px;
    position: relative;
}

.journal-kicker {
    font-size: 13px;
    letter-spacing: 12px;
    text-transform: uppercase;
    color: #fbbf24;
    font-weight: 600;
    margin-bottom: 12px;
}

.journal-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 72px;
    font-weight: 900;
    letter-spacing: -3px;
    line-height: 1;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    margin-bottom: 8px;
}

.journal-subtitle {
    font-family: 'Merriweather', serif;
    font-style: italic;
    font-size: 16px;
    color: #a78bfa;
    letter-spacing: 6px;
    text-transform: uppercase;
}

.journal-meta {
    font-size: 12px;
    color: #94a3b8;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-top: 12px;
}

.journal-meta strong {
    color: #fbbf24;
}

/* Декоративный орнамент */
.journal-ornament {
    text-align: center;
    color: #fbbf24;
    font-size: 20px;
    letter-spacing: 8px;
    margin: 30px 0;
    opacity: 0.6;
}

/* === ГЛАВНАЯ СТАТЬЯ (LEAD) === */
.journal-lead {
    margin-bottom: 50px;
}

.journal-lead-headline {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 42px;
    font-weight: 700;
    line-height: 1.2;
    color: #fff;
    margin-bottom: 20px;
    letter-spacing: -1px;
}

.journal-lead-kicker {
    display: inline-block;
    padding: 6px 20px;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #0f172a;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 16px;
}

/* Текст в две колонки */
.journal-columns {
    column-count: 2;
    column-gap: 40px;
    column-rule: 1px solid rgba(255, 255, 255, 0.1);
    text-align: justify;
    hyphens: auto;
}

.journal-columns p {
    margin-bottom: 16px;
    line-height: 1.8;
    font-size: 16px;
    color: #e2e8f0;
}

/* Буквица (drop cap) */
.journal-drop-cap::first-letter {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 72px;
    font-weight: 700;
    float: left;
    line-height: 0.8;
    margin: 8px 12px 0 0;
    color: #fbbf24;
}

/* === GRID LAYOUT: main + sidebar === */
.journal-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 40px;
    margin-bottom: 50px;
}

.journal-main {
    min-width: 0;
}

.journal-sidebar {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

/* === SIDEBAR БЛОКИ === */
.sidebar-block {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 27, 75, 0.4));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
}

.sidebar-block::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), transparent 50%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.5;
    pointer-events: none;
}

.sidebar-block-title {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.sidebar-block-icon {
    font-size: 24px;
}

/* Аффирмация — большая цитата */
.affirmation-quote {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 18px;
    line-height: 1.6;
    color: #fde68a;
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), transparent);
    border-left: 3px solid #fbbf24;
    border-radius: 8px;
    position: relative;
}

.affirmation-quote::before {
    content: """;
    position: absolute;
    top: -10px;
    left: 10px;
    font-size: 48px;
    color: rgba(251, 191, 36, 0.3);
    font-family: Georgia, serif;
}

/* Таро — карточка */
.tarot-card-display {
    display: flex;
    gap: 16px;
    align-items: center;
}

.tarot-card-img {
    width: 80px;
    height: 130px;
    background: linear-gradient(135deg, #4c1d95, #1e1b4b);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    flex-shrink: 0;
    box-shadow: 0 8px 20px -8px rgba(168, 85, 247, 0.5);
    position: relative;
    overflow: hidden;
}

.tarot-card-img::before {
    content: "";
    position: absolute;
    inset: 3px;
    border: 1px solid rgba(251, 191, 36, 0.4);
    border-radius: 6px;
}

.tarot-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
}

.tarot-info h3 {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    margin-bottom: 6px;
    color: #fff;
}

.tarot-info p {
    font-size: 13px;
    line-height: 1.6;
    color: #cbd5e1;
    font-style: italic;
}

/* Биоритмы — инфографика */
.biorhythms-chart {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.bio-item {
    text-align: center;
    padding: 12px 8px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.bio-label {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
    margin-bottom: 6px;
}

.bio-value {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 8px;
}

.bio-value.pos {
    background: linear-gradient(135deg, #34d399, #10b981);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.bio-value.neg {
    background: linear-gradient(135deg, #f87171, #ef4444);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.bio-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
}

.bio-bar-center {
    position: absolute;
    top: 0;
    left: 50%;
    width: 1px;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
}

.bio-bar-fill {
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 3px;
}

.bio-days {
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
    margin-top: 12px;
    font-style: italic;
}

/* Ретроградные планеты */
.retro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
}

.retro-item {
    background: rgba(236, 72, 153, 0.08);
    border: 1px solid rgba(236, 72, 153, 0.2);
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
}

.retro-planet {
    font-size: 20px;
    margin-bottom: 4px;
}

.retro-name {
    font-size: 11px;
    font-weight: 600;
    color: #fff;
}

.retro-status {
    font-size: 10px;
    color: #f0abfc;
    margin-top: 2px;
}

/* === БЛОГ: "См. также" === */
.journal-blog {
    margin-top: 50px;
}

.journal-blog-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.blog-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.blog-card {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 27, 75, 0.3));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    text-decoration: none;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.blog-card:hover {
    transform: translateY(-4px);
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow: 0 12px 30px -10px rgba(168, 85, 247, 0.3);
}

.blog-cover {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    overflow: hidden;
}

.blog-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.blog-date {
    font-size: 10px;
    color: #94a3b8;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.blog-title {
    font-family: 'Merriweather', serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    line-height: 1.4;
}

.blog-excerpt {
    font-size: 12px;
    color: #cbd5e1;
    line-height: 1.5;
}

/* === FOOTER === */
.journal-footer {
    margin-top: 60px;
    padding: 40px 0 30px;
    border-top: 3px double rgba(251, 191, 36, 0.3);
    text-align: center;
    color: #94a3b8;
    font-size: 12px;
    position: relative;
}

.journal-footer::before {
    content: "❖";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: #020617;
    padding: 0 16px;
    color: #fbbf24;
    font-size: 16px;
}

.journal-footer-cta {
    display: inline-block;
    margin-top: 20px;
    padding: 14px 32px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: #fff;
    border-radius: 999px;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 0 20px -4px rgba(168, 85, 247, 0.5);
    transition: all 0.3s;
}

.journal-footer-cta:hover {
    color: #fff;
    text-decoration: none;
    box-shadow: 0 0 30px -2px rgba(168, 85, 247, 0.7);
    transform: translateY(-2px);
}

/* === RESPONSIVE === */
@media (max-width: 900px) {
    .journal-grid {
        grid-template-columns: 1fr;
    }
    .journal-columns {
        column-count: 1;
    }
    .blog-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .journal-title {
        font-size: 48px;
    }
    .journal-lead-headline {
        font-size: 32px;
    }
    .blog-grid {
        grid-template-columns: 1fr;
    }
    .biorhythms-chart {
        grid-template-columns: 1fr;
    }
    .tarot-card-display {
        flex-direction: column;
        text-align: center;
    }
}

/* === PRE-FOOTER: Луна + Колонка редактора === */
.journal-pre-footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin: 60px 0 40px;
    padding: 20px 0;
}

.pre-footer-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.pre-footer-kicker {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #a78bfa;
    font-weight: 700;
}

.pre-footer-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
}

/* Луна */
.moon-display {
    display: flex;
    gap: 24px;
    align-items: center;
}

.moon-icon {
    width: 100px;
    height: 100px;
    font-size: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.15), transparent 70%);
    border-radius: 50%;
    flex-shrink: 0;
    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.3));
}

.moon-info h4 {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    margin-bottom: 4px;
    color: #fbbf24;
}

.moon-stats {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: #cbd5e1;
    margin: 8px 0;
}

.moon-stat {
    display: flex;
    align-items: center;
    gap: 4px;
}

.moon-stat strong {
    color: #fff;
}

.moon-text {
    font-size: 14px;
    color: #cbd5e1;
    line-height: 1.6;
    font-style: italic;
}

/* Колонка редактора */
.editor-card {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    text-decoration: none;
    padding: 16px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.4), rgba(30, 27, 75, 0.25));
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    transition: all 0.3s;
}

.editor-card:hover {
    text-decoration: none;
    border-color: rgba(168, 85, 247, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.25);
}

.editor-cover {
    width: 110px;
    height: 110px;
    border-radius: 10px;
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    overflow: hidden;
}

.editor-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.editor-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.editor-date {
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}

.editor-article-title {
    font-family: 'Merriweather', serif;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    line-height: 1.35;
}

.editor-excerpt {
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.5;
}

.editor-link {
    font-size: 13px;
    color: #fbbf24;
    font-weight: 600;
    margin-top: 4px;
}

@media (max-width: 800px) {
    .journal-pre-footer {
        grid-template-columns: 1fr;
        gap: 32px;
    }
    .editor-card {
        flex-direction: column;
    }
    .editor-cover {
        width: 100%;
        height: 140px;
    }
}


/* === FEATURED BLOG POST (одна большая карточка) === */
.blog-feature {
    display: grid;
    grid-template-columns: 440px 1fr;
    gap: 36px;
    align-items: center;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.5), rgba(30, 27, 75, 0.3));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 24px;
    text-decoration: none;
    transition: all 0.3s;
}

.blog-feature:hover {
    text-decoration: none;
    border-color: rgba(168, 85, 247, 0.4);
    transform: translateY(-3px);
    box-shadow: 0 16px 40px -12px rgba(168, 85, 247, 0.3);
}

.blog-feature-cover {
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 14px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56px;
}

.blog-feature-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s;
}

.blog-feature:hover .blog-feature-cover img {
    transform: scale(1.05);
}

.blog-feature-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.blog-feature-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 30px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    margin: 8px 0 12px;
}

.blog-feature-excerpt {
    font-size: 15px;
    color: #cbd5e1;
    line-height: 1.75;
    margin-bottom: 16px;
}

@media (max-width: 900px) {
    .blog-feature {
        grid-template-columns: 1fr;
        gap: 20px;
    }
    .blog-feature-title {
        font-size: 24px;
    }
}


/* === Ссылки внутри блоков журнала === */
.mag-block-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    font-size: 13px;
    font-weight: 600;
    color: #a78bfa;
    text-decoration: none;
    transition: color 0.2s, gap 0.2s;
}

.mag-block-link:hover {
    color: #c4b5fd;
    text-decoration: none;
    gap: 10px;
}


/* === Блок «Поделиться» === */
.journal-share {
    margin: 20px auto 0;
    max-width: 680px;
    text-align: center;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.5), rgba(30, 27, 75, 0.3));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 28px 24px;
}

.journal-share-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
}

.journal-share-sub {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 18px;
}

.journal-share-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
}

.share-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.share-btn:hover {
    transform: translateY(-2px);
    color: #fff;
    text-decoration: none;
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.5);
}

.share-tg { background: #229ED9; }
.share-vk { background: #0077FF; }
.share-wa { background: #25D366; }
.share-ok { background: #EE8208; }
.share-copy {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
}


/* === Доп. блоки по знаку: финансы и здоровье === */
.sign-extras {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin: 40px 0;
}

.sign-extra-card {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.5), rgba(30, 27, 75, 0.3));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
}

.sign-extra-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--extra-color, #a855f7), transparent);
}

.sign-extra-finance { --extra-color: #fbbf24; }
.sign-extra-health { --extra-color: #34d399; }

.sign-extra-kicker {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--extra-color, #a855f7);
    display: flex;
    align-items: center;
    gap: 8px;
}

.sign-extra-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
}

.sign-extra-text {
    font-size: 14px;
    line-height: 1.7;
    color: #cbd5e1;
    flex: 1;
}

.sign-extra-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--extra-color, #a855f7);
    text-decoration: none;
    transition: gap 0.2s;
}

.sign-extra-link:hover { gap: 10px; text-decoration: none; }

@media (max-width: 800px) {
    .sign-extras { grid-template-columns: 1fr; }
}

</style>

<div class="journal-page">
    {{-- Мелкий верхний колонтитул --}}
    <div class="journal-masthead-small">
        Выпуск №{{ $issue->id }}
    </div>

    {{-- Masthead --}}
    <div class="journal-masthead">
        <div class="journal-kicker">Журнал</div>
        <h1 class="journal-title">AI АСТРОЛОГ</h1>
        <div class="journal-subtitle">Персональный выпуск</div>
        <div class="journal-meta">
            @if($issue->content['meta']['user_name'] ?? null)
                Для <strong>{{ $issue->content['meta']['user_name'] }}</strong> ·
            @endif
            {{ $issue->issue_date->translatedFormat('l, d F Y') }}
        </div>
    </div>

    {{-- Главная статья: гороскоп --}}
    @if($issue->content['horoscope'] ?? null)
        <article class="journal-lead">
            <span class="journal-lead-kicker">
                @if($issue->content['horoscope']['type'] === 'personal')
                    ⭐ Ваш персональный прогноз
                @elseif($issue->content['horoscope']['type'] === 'free_personal')
                    ⭐ Бесплатный персональный
                @else
                    ⭐ Гороскоп: {{ $issue->content['horoscope']['sign_name'] ?? 'ваш знак' }}
                @endif
            </span>
            <h2 class="journal-lead-headline">
                @if($issue->content['horoscope']['horoscope_name'] ?? null)
                    {{ $issue->content['horoscope']['horoscope_name'] }}
                @else
                    Что говорят звёзды сегодня
                @endif
            </h2>
            
            <div class="journal-columns">
                <p class="journal-drop-cap">{!! nl2br(e($issue->content['horoscope']['content'])) !!}</p>
            </div>
        </article>
    @else
        <div class="journal-lead" style="text-align: center; padding: 40px;">
            <span class="journal-lead-kicker">⭐ Ваш день</span>
            <h2 class="journal-lead-headline" style="font-size: 32px;">Звёзды наблюдают за вами</h2>
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; max-width: 600px; margin: 0 auto;">
                Персональный гороскоп появится, когда вы заполните данные рождения и закажете натальную карту.
            </p>
        </div>
    @endif


    {{-- Grid: main + sidebar --}}
    <div class="journal-grid">
        {{-- MAIN: Аффирмация --}}
        @if($issue->content['affirmation'] ?? null)
            <div class="journal-main">
                <div class="sidebar-block" style="--accent: #fbbf24;">
                    <div class="sidebar-block-title">
                        <span class="sidebar-block-icon">💫</span>
                        <span>Аффирмация дня</span>
                    </div>
                    <div class="affirmation-quote">
                        {{ $issue->content['affirmation']['description'] }}
                    </div>
                    @if($issue->content['affirmation']['title'] ?? null)
                        <div style="text-align: center; margin-top: 16px; font-size: 14px; color: #a78bfa; font-style: italic;">
                            — {{ $issue->content['affirmation']['title'] }}
                        </div>
                    @endif
                    <a href="/affirmations" class="mag-block-link">Все аффирмации →</a>
                </div>
            </div>
        @endif

        {{-- SIDEBAR --}}
        <div class="journal-sidebar">
            {{-- Таро --}}
            @if($issue->content['tarot'] ?? null)
                <div class="sidebar-block">
                    <div class="sidebar-block-title">
                        <span class="sidebar-block-icon">🎴</span>
                        <span>Карта дня</span>
                    </div>
                    <div class="tarot-card-display">
                        <div class="tarot-card-img">
                            @if($issue->content['tarot']['image'] ?? null)
                                <img src="{{ asset('storage/' . $issue->content['tarot']['image']) }}" alt="{{ $issue->content['tarot']['name'] }}">
                            @else
                                🎴
                            @endif
                        </div>
                        <div class="tarot-info">
                            <h3>{{ $issue->content['tarot']['name'] }}</h3>
                            <p>{{ $issue->content['tarot']['meaning_today'] }}</p>
                        </div>
                    </div>
                    <a href="/tarot" class="mag-block-link">Карта дня →</a>
                </div>
            @endif

            {{-- Биоритмы --}}
            @if($issue->content['biorhythms'] ?? null)
                @php $bio = $issue->content['biorhythms']; @endphp
                <div class="sidebar-block">
                    <div class="sidebar-block-title">
                        <span class="sidebar-block-icon">📊</span>
                        <span>Биоритмы</span>
                    </div>
                    <div class="biorhythms-chart">
                        @foreach([
                            ['k' => 'physical', 'label' => 'Физ', 'color' => '#34d399'],
                            ['k' => 'emotional', 'label' => 'Эмоц', 'color' => '#f0abfc'],
                            ['k' => 'intellectual', 'label' => 'Инт', 'color' => '#60a5fa'],
                        ] as $b)
                            @php $v = $bio[$b['k']]; @endphp
                            <div class="bio-item">
                                <div class="bio-label">{{ $b['label'] }}</div>
                                <div class="bio-value {{ $v >= 0 ? 'pos' : 'neg' }}">{{ $v >= 0 ? '+' : '' }}{{ $v }}%</div>
                                <div class="bio-bar">
                                    <div class="bio-bar-center"></div>
                                    <div class="bio-bar-fill" style="{{ $v >= 0 ? 'left:50%' : 'left:' . (50 + $v/2) . '%' }};width:{{ abs($v)/2 }}%;background:{{ $b['color'] }}"></div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                    <div class="bio-days">День вашей жизни: <strong style="color:#fbbf24">{{ $bio['days_alive'] }}</strong></div>
                    <a href="/biorhythms" class="mag-block-link">Мои биоритмы →</a>
                </div>
            @endif

            {{-- Ретроградные --}}
            @if(!empty($issue->content['retrograde']))
                <div class="sidebar-block">
                    <div class="sidebar-block-title">
                        <span class="sidebar-block-icon">☿</span>
                        <span>Ретроградные планеты</span>
                    </div>
                    <div class="retro-grid">
                        @foreach($issue->content['retrograde'] as $p)
                            <div class="retro-item">
                                <div class="retro-planet">{{ $p['symbol'] ?? '☿' }}</div>
                                <div class="retro-name">{{ $p['name'] ?? 'Планета' }}</div>
                                <div class="retro-status">{{ $p['status'] ?? 'Ретро' }}</div>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- Блог: одна последняя статья крупной карточкой --}}
    @if(!empty($issue->content['blog']))
        @php $latest = $issue->content['blog'][0]; @endphp
        <section class="journal-blog">
            <h2 class="journal-blog-title">
                <span>📖</span>
                <span>Читайте также в нашем блоге</span>
            </h2>
            <a href="{{ $latest['url'] }}" class="blog-feature">
                <div class="blog-feature-cover">
                    @if($latest['cover'] ?? null)
                        <img src="{{ asset('storage/' . $latest['cover']) }}" alt="{{ $latest['title'] }}">
                    @else
                        ✨
                    @endif
                </div>
                <div class="blog-feature-content">
                    <div class="blog-date">{{ \Carbon\Carbon::parse($latest['date'])->translatedFormat('d F Y') }}</div>
                    <div class="blog-feature-title">{{ $latest['title'] }}</div>
                    @if($latest['excerpt'] ?? null)
                        <div class="blog-feature-excerpt">{{ Str::limit($latest['excerpt'], 260) }}</div>
                    @endif
                    <div class="editor-link">Читать полную статью →</div>
                </div>
            </a>
        </section>
    @endif


    {{-- Pre-footer: Луна + Колонка редактора --}}
    <section class="journal-pre-footer">
        <div class="pre-footer-col">
            <div class="pre-footer-kicker">🌙 ФАЗА ЛУНЫ</div>
            <div class="moon-display">
                <div class="moon-icon">{{ $moon['emoji'] }}</div>
                <div class="moon-info">
                    <h4>{{ $moon['name'] }}</h4>
                    <div class="moon-stats">
                        <div class="moon-stat">💡 <strong>{{ $moon['illumination'] }}%</strong></div>
                        <div class="moon-stat">📅 <strong>{{ $moon['lunarDay'] }}-й день</strong></div>
                    </div>
                    <div class="moon-text">{{ $moon['text'] }}</div>
                    <a href="/moon" class="mag-block-link">Лунный календарь →</a>
                </div>
            </div>
        </div>

        <div class="pre-footer-col">
            <div class="pre-footer-kicker">✍️ КОЛОНКА РЕДАКТОРА</div>
            @if($editorPost)
                <a href="/blog/{{ $editorPost->slug }}" class="editor-card">
                    <div class="editor-cover">
                        @if($editorPost->cover_image)
                            <img src="{{ asset('storage/' . $editorPost->cover_image) }}" alt="">
                        @else
                            ✍️
                        @endif
                    </div>
                    <div class="editor-content">
                        <div class="editor-date">{{ $editorPost->published_at?->translatedFormat('d F Y') }}</div>
                        <div class="editor-article-title">{{ $editorPost->title }}</div>
                        @if($editorPost->excerpt)
                            <div class="editor-excerpt">{{ Str::limit($editorPost->excerpt, 140) }}</div>
                        @endif
                        <div class="editor-link">Читать полностью →</div>
                    </div>
                </a>
            @else
                <div style="color: #94a3b8; font-style: italic; padding: 20px;">
                    Скоро здесь появится новая колонка редактора.
                </div>
            @endif
        </div>
    </section>

    {{-- Поделиться выпуском --}}
    @php
        $magUrl = url('/magazine/' . $issue->uuid);
        $shareText = '💫 Мой персональный журнал AI-астролога от ' . $issue->issue_date->translatedFormat('d.m.Y');
    @endphp
    <section class="journal-share">
        <div class="journal-share-title">Поделиться выпуском</div>
        <div class="journal-share-sub">Отправьте свой персональный журнал друзьям</div>
        <div class="journal-share-buttons">
            <a class="share-btn share-tg" target="_blank" rel="noopener"
               href="https://t.me/share/url?url={{ urlencode($magUrl) }}&text={{ urlencode($shareText) }}">✈️ Telegram</a>
            <a class="share-btn share-vk" target="_blank" rel="noopener"
               href="https://vk.com/share.php?url={{ urlencode($magUrl) }}">💙 ВКонтакте</a>
            <a class="share-btn share-wa" target="_blank" rel="noopener"
               href="https://wa.me/?text={{ urlencode($shareText . ' ' . $magUrl) }}">💬 WhatsApp</a>
            <a class="share-btn share-ok" target="_blank" rel="noopener"
               href="https://connect.ok.ru/offer?url={{ urlencode($magUrl) }}">🧡 Одноклассники</a>
            <button class="share-btn share-copy" type="button"
                    onclick="navigator.clipboard.writeText('{{ $magUrl }}').then(() => { this.textContent = '✓ Скопировано'; setTimeout(() => this.textContent = '🔗 Скопировать ссылку', 2000); })">🔗 Скопировать ссылку</button>
        </div>
    </section>

    {{-- Footer --}}


    <div class="journal-footer">
        <div>Ваш персональный журнал сгенерирован {{ \Carbon\Carbon::parse($issue->content['meta']['generated_at'])->translatedFormat('d F Y в H:i') }}</div>
        <div style="margin-top: 8px;">© AI Астролог · my.neiro-astro.ru</div>
        <a href="/dashboard" class="journal-footer-cta">Перейти в личный кабинет →</a>
    </div>
</div>
@endsection
