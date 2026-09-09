<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Блог AI-астролога — AI Астролог')</title>
    <meta name="description" content="@yield('description', 'Ежедневные прогнозы, советы астролога и разборы энергий дня от AI-астролога.')">
    @yield('meta')
    <link rel="alternate" type="application/rss+xml" title="Блог AI-астролога" href="{{ url('/blog/rss') }}">
    <link rel="icon" type="image/svg+xml" href="{{ url('/favicon.svg') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ url('/favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ url('/favicon.svg') }}">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=merriweather:400,700|inter:400,500,600,700&display=swap" rel="stylesheet">
    <style>
        :root{--primary:#6d28d9;--primary-light:#a78bfa;--bg:#faf8ff;--surface:#fff;--text:#1f2937;--muted:#6b7280;--border:#e5e7eb}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;-webkit-font-smoothing:antialiased}
        a{color:var(--primary);text-decoration:none}
        a:hover{text-decoration:underline}
        .container{max-width:1100px;margin:0 auto;padding:0 24px}

        /* ===== ШАПКА (идентична SiteHeader) ===== */
        .site-header{position:sticky;top:0;z-index:50;background:rgba(2,6,23,.85);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.1)}
        .sh-inner{max-width:1152px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .sh-logo{display:flex;align-items:center;gap:8px;color:#fff;font-size:20px;font-weight:700;text-decoration:none}
        .sh-logo:hover{color:#fff;text-decoration:none}
        .sh-logo span{font-size:24px}
        .sh-nav{display:flex;align-items:center;gap:24px;font-size:14px}
        .sh-nav a{color:#cbd5e1;text-decoration:none;transition:color .2s}
        .sh-nav a:hover{color:#fff;text-decoration:none}
        .sh-nav a.active{color:#a78bfa;font-weight:600}
        .sh-right{display:flex;align-items:center;gap:12px}
        .sh-login{color:#cbd5e1;font-size:14px;text-decoration:none}
        .sh-login:hover{color:#fff;text-decoration:none}
        .sh-register{background:#7c3aed;color:#fff;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s}
        .sh-register:hover{background:#8b5cf6;color:#fff;text-decoration:none}
        .sh-logout{background:#1e293b;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:8px 16px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s}
        .sh-logout:hover{background:#334155}
        .burger{display:none;flex-direction:column;justify-content:center;align-items:center;width:40px;height:40px;border-radius:12px;background:rgba(30,41,59,.8);border:1px solid rgba(255,255,255,.1);cursor:pointer}
        .burger span{display:block;width:20px;height:2px;background:#fff;transition:all .3s}
        .burger span+span{margin-top:5px}
        .mobile-menu{display:none;border-top:1px solid rgba(255,255,255,.1);background:rgba(2,6,23,.97)}
        .mobile-menu nav{max-width:1152px;margin:0 auto;padding:12px 16px;display:flex;flex-direction:column;gap:4px}
        .mobile-menu a,.mobile-menu button{display:block;width:100%;padding:12px 16px;border-radius:12px;font-size:14px;font-weight:500;color:#cbd5e1;text-decoration:none;background:none;border:none;text-align:left;cursor:pointer;font-family:inherit}
        .mobile-menu a:hover{background:rgba(255,255,255,.05);color:#fff;text-decoration:none}
        .mobile-menu a.active{background:rgba(124,58,237,.2);color:#c4b5fd}
        .mobile-menu a.m-register{background:#7c3aed;color:#fff;text-align:center;font-weight:600;margin-top:8px}
        .mobile-menu a.m-register:hover{background:#8b5cf6}
        .mobile-menu button.m-logout{background:#1e293b;border:1px solid rgba(255,255,255,.1);color:#fff;font-weight:600;margin-top:8px}
        body.menu-open .mobile-menu{display:block}
        body.menu-open .burger span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}
        body.menu-open .burger span:nth-child(2){opacity:0}
        body.menu-open .burger span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
        /* Видимость по авторизации */
        .only-user{display:none!important}
        body.logged-in .only-user{display:block!important}
        body.logged-in .only-guest{display:none!important}
        .only-admin{display:none!important}
        body.is-admin .only-admin{display:block!important}
        @media(max-width:767px){
            .sh-nav{display:none}
            .sh-right>*:not(.burger){display:none!important}
            .burger{display:flex}
        }
        @media(min-width:768px){.mobile-menu{display:none!important}}

        /* ===== HERO БЛОГА ===== */
        header.hero{background:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);color:#fff;padding:48px 0 64px;margin-bottom:48px;position:relative;overflow:hidden}
        header.hero::before{content:"✨";position:absolute;right:10%;top:20%;font-size:120px;opacity:.1;transform:rotate(15deg)}
        header.hero h1{font-family:'Merriweather',serif;font-size:42px;font-weight:700;margin-bottom:8px}
        header.hero p{font-size:18px;opacity:.85;max-width:600px}
        header.hero a.back{color:#fff;font-weight:600;display:inline-block;margin-bottom:24px;opacity:.9}
        h2,h3{font-family:'Merriweather',serif;font-weight:700;color:#1f2937}
        .posts{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:28px;margin-bottom:64px}
        .post{background:var(--surface);border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(109,40,217,.08);transition:all .25s;border:1px solid var(--border);display:flex;flex-direction:column}
        .post:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(109,40,217,.15)}
        .post-cover{overflow:hidden;background:linear-gradient(135deg,#a78bfa 0%,#6d28d9 100%);display:flex;align-items:center;justify-content:center;font-size:48px;min-height:120px}
        .post-cover img{width:100%;height:auto;display:block}
        .post-body{padding:24px;flex:1;display:flex;flex-direction:column}
        .post-meta{display:flex;gap:12px;align-items:center;font-size:13px;color:var(--muted);margin-bottom:12px;flex-wrap:wrap}
        .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.3px;text-transform:uppercase}
        .badge-ai{background:#ede9fe;color:#6d28d9}
        .badge-human{background:#dcfce7;color:#166534}
        .post h3{font-size:20px;line-height:1.35;margin-bottom:10px}
        .post h3 a{color:inherit}
        .post h3 a:hover{color:var(--primary);text-decoration:none}
        .post-excerpt{color:var(--muted);font-size:15px;margin-bottom:16px;flex-limit:1}
        .read-more{color:var(--primary);font-weight:600;font-size:14px}
        .pagination{display:flex;justify-content:center;gap:8px;margin:40px 0}
        .pagination a,.pagination span{padding:8px 14px;border-radius:8px;font-weight:500}
        .pagination .current{background:var(--primary);color:#fff}
        footer{background:#1f2937;color:#d1d5db;padding:32px 0;text-align:center;font-size:14px;margin-top:80px}
        footer a{color:#fff}
        @media(max-width:640px){header.hero h1{font-size:30px}.container{padding:0 16px}}
    </style>
</head>
<body>
<div class="site-header">
    <div class="sh-inner">
        <a href="/" class="sh-logo"><span>🔮</span> AI Астролог</a>

        <nav class="sh-nav">
            <a href="/horoscopes">Гороскопы</a>
            <a href="/divinations">Гадания</a>
                <a href="/calendars" style="color:#cbd5e1;text-decoration:none;font-size:14px">Календари</a>
            <a href="/crystal-ball">Хрустальный шар</a>
            <a href="/blog" class="active">Блог</a>
            <a href="/pricing">Тарифы</a>
            <a href="/dashboard" class="only-user">Личный кабинет</a>
            <a href="/admin" class="only-admin">Админка</a>
        </nav>

        <div class="sh-right">
            <a href="/login" class="sh-login only-guest">Войти</a>
            <a href="/register" class="sh-register only-guest">Регистрация</a>
            <button class="sh-logout only-user" data-logout>Выйти</button>
            <button class="burger" id="burger" aria-label="Меню"><span></span><span></span><span></span></button>
        </div>
    </div>

    <div class="mobile-menu">
        <nav>
            <a href="/horoscopes">Гороскопы</a>
            <a href="/divinations">Гадания</a>
            <a href="/crystal-ball">Хрустальный шар</a>
            <a href="/blog" class="active">Блог</a>
            <a href="/pricing">Тарифы</a>
            <a href="/dashboard" class="only-user">Личный кабинет</a>
            <a href="/admin" class="only-admin">Админка</a>
            <a href="/login" class="only-guest">Войти</a>
            <a href="/register" class="m-register only-guest">Регистрация</a>
            <button class="m-logout only-user" data-logout>Выйти</button>
        </nav>
    </div>
</div>

<header class="hero">
    <div class="container">
        <a href="/" class="back">← AI Астролог</a>
        <h1>Блог AI-астролога</h1>
        <p>Ежедневные прогнозы, разборы энергий дня и профессиональные советы от вашего астролога-ассистента</p>
    </div>
</header>
<main class="container">@yield('content')</main>
<footer><div class="container">© {{ date('Y') }} AI Астролог — блог <a href="{{ url('/blog/rss') }}" style="color:#a78bfa;margin-left:16px">📡 RSS</a></div></footer>

<script>
(function(){
    var token = localStorage.getItem('auth_token');
    if (token) {
        document.body.classList.add('logged-in');
        fetch('/api/me', { headers: { Authorization: 'Bearer ' + token } })
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(d){ if (d && d.user && d.user.is_admin) document.body.classList.add('is-admin'); })
            .catch(function(){});
    }
    document.getElementById('burger').addEventListener('click', function(){
        document.body.classList.toggle('menu-open');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function(a){
        a.addEventListener('click', function(){ document.body.classList.remove('menu-open'); });
    });
    document.querySelectorAll('[data-logout]').forEach(function(b){
        b.addEventListener('click', function(){
            localStorage.removeItem('auth_token');
            location.href = '/login';
        });
    });
})();
</script>
</body>
</html>
