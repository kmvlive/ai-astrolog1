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
        :root{--accent:#a855f7;--accent-2:#ec4899;--bg:#020617;--surface:rgba(15,23,42,.75);--surface-hover:rgba(30,41,59,.85);--text:#e2e8f0;--muted:#94a3b8;--border:rgba(255,255,255,.08)}
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased;min-height:100vh}
        body{position:relative;overflow-x:hidden}
        a{color:var(--accent);text-decoration:none;transition:color .2s}
        a:hover{color:var(--accent-2);text-decoration:none}
        .container{max-width:1100px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
        h1,h2,h3,h4{font-family:'Merriweather',serif;font-weight:700;color:#fff;line-height:1.25}

        /* ===== КОСМОС ===== */
        .blog-cosmos{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;isolation:isolate}
        .star-layer{position:absolute;inset:0;background-repeat:repeat;background-image:
            radial-gradient(1px 1px at 25px 35px,hsla(0,0%,100%,.45),transparent),
            radial-gradient(1px 1px at 120px 90px,hsla(0,0%,100%,.3),transparent),
            radial-gradient(1.5px 1.5px at 180px 140px,rgba(200,220,255,.55),transparent),
            radial-gradient(2px 2px at 300px 200px,rgba(167,139,250,.75),transparent),
            radial-gradient(2px 2px at 200px 320px,hsla(0,0%,100%,.8),transparent);
            background-size:240px 240px,240px 240px,320px 320px,400px 400px,400px 400px;
            animation:star-drift 70s linear infinite}
        @keyframes star-drift{to{background-position:-240px 240px,-240px 240px,-320px 320px,-400px 400px,-400px 400px}}
        .comet{position:absolute;width:3px;height:3px;background:radial-gradient(circle,#fff,rgba(200,220,255,.8) 40%,transparent 70%);border-radius:50%;box-shadow:0 0 12px 4px rgba(200,220,255,.6);opacity:0}
        .comet::before{content:"";position:absolute;top:50%;right:100%;width:80px;height:2px;background:linear-gradient(270deg,rgba(200,220,255,.9),rgba(200,220,255,.4) 40%,transparent);transform:translateY(-50%);filter:blur(1px)}
        @keyframes comet-fly{0%{transform:translate(-20vw,30vh) rotate(-15deg);opacity:0}5%{opacity:1}45%{opacity:1}100%{transform:translate(120vw,-20vh) rotate(-15deg);opacity:0}}
        @keyframes comet-fly-2{0%{transform:translate(120vw,60vh) rotate(-165deg);opacity:0}5%{opacity:1}45%{opacity:1}100%{transform:translate(-20vw,-10vh) rotate(-165deg);opacity:0}}
        .comet-1{top:20%;left:0;animation:comet-fly 14s ease-in-out 2s infinite}
        .comet-2{top:55%;right:0;animation:comet-fly-2 18s ease-in-out 6s infinite}
        .comet-3{top:75%;left:0;animation:comet-fly 22s ease-in-out 10s infinite}

        /* ===== ШАПКА ===== */
        .site-header{position:sticky;top:0;z-index:50;background:rgba(2,6,23,.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.1)}
        .sh-inner{max-width:1152px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .sh-logo{display:flex;align-items:center;gap:8px;color:#fff;font-size:20px;font-weight:700;text-decoration:none}
        .sh-logo:hover{color:#fff}
        .sh-logo span{font-size:24px}
        .sh-nav{display:flex;align-items:center;gap:24px;font-size:14px}
        .sh-nav a{color:#cbd5e1;text-decoration:none;transition:color .2s}
        .sh-nav a:hover{color:#fff}
        .sh-nav a.active{color:var(--accent);font-weight:600}
        .sh-right{display:flex;align-items:center;gap:12px}
        .sh-login{color:#cbd5e1;font-size:14px;text-decoration:none}
        .sh-login:hover{color:#fff}
        .sh-register{background:#7c3aed;color:#fff;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:600;text-decoration:none;transition:all .25s;box-shadow:0 0 18px -4px rgba(168,85,247,.5)}
        .sh-register:hover{background:#8b5cf6;color:#fff;box-shadow:0 0 24px -2px rgba(168,85,247,.7)}
        .sh-logout{background:#1e293b;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:8px 16px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s}
        .sh-logout:hover{background:#334155}
        .burger{display:none;flex-direction:column;justify-content:center;align-items:center;width:40px;height:40px;border-radius:12px;background:rgba(30,41,59,.8);border:1px solid rgba(255,255,255,.1);cursor:pointer}
        .burger span{display:block;width:20px;height:2px;background:#fff;transition:all .3s}
        .burger span+span{margin-top:5px}
        .mobile-menu{display:none;border-top:1px solid rgba(255,255,255,.1);background:rgba(2,6,23,.97)}
        .mobile-menu nav{max-width:1152px;margin:0 auto;padding:12px 16px;display:flex;flex-direction:column;gap:4px}
        .mobile-menu a,.mobile-menu button{display:block;width:100%;padding:12px 16px;border-radius:12px;font-size:14px;font-weight:500;color:#cbd5e1;text-decoration:none;background:none;border:none;text-align:left;cursor:pointer;font-family:inherit}
        .mobile-menu a:hover{background:rgba(255,255,255,.05);color:#fff}
        .mobile-menu a.active{background:rgba(124,58,237,.2);color:#c4b5fd}
        .mobile-menu a.m-register{background:#7c3aed;color:#fff;text-align:center;font-weight:600;margin-top:8px}
        .mobile-menu a.m-register:hover{background:#8b5cf6}
        .mobile-menu button.m-logout{background:#1e293b;border:1px solid rgba(255,255,255,.1);color:#fff;font-weight:600;margin-top:8px}
        body.menu-open .mobile-menu{display:block}
        body.menu-open .burger span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}
        body.menu-open .burger span:nth-child(2){opacity:0}
        body.menu-open .burger span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
        .only-user{display:none!important}
        body.logged-in .only-user{display:block!important}
        body.logged-in .only-guest{display:none!important}
        .only-admin{display:none!important}
        body.is-admin .only-admin{display:block!important}
        @media(max-width:767px){.sh-nav{display:none}.sh-right>*:not(.burger){display:none!important}.burger{display:flex}}
        @media(min-width:768px){.mobile-menu{display:none!important}}

        /* ===== HERO ===== */
        header.hero{position:relative;padding:72px 0 64px;margin-bottom:48px;overflow:hidden}
        header.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(168,85,247,.15),transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(236,72,153,.12),transparent 55%);z-index:0}
        header.hero::after{content:"✨";position:absolute;right:5%;top:15%;font-size:180px;opacity:.04;transform:rotate(15deg);z-index:1;pointer-events:none}
        header.hero h1{font-size:clamp(32px,5vw,48px);background:linear-gradient(135deg,#fff 0%,#c4b5fd 60%,#f0abfc 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;margin-bottom:16px}
        header.hero p{font-size:18px;color:#cbd5e1;max-width:600px;position:relative;z-index:2}
        .hero-eyebrow{display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.3);color:#c4b5fd;font-size:13px;font-weight:600;margin-bottom:20px;letter-spacing:.05em}
        @media(max-width:640px){header.hero{padding:48px 0 40px}}

        /* ===== КАТЕГОРИИ ===== */
        .cat-menu{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 40px;padding:24px;background:rgba(15,23,42,.6);backdrop-filter:blur(12px);border-radius:24px;border:1px solid rgba(255,255,255,.08)}
        .cat-chip{padding:9px 18px;background:rgba(30,41,59,.5);border-radius:999px;font-size:13px;font-weight:500;color:#cbd5e1;text-decoration:none;transition:all .3s;border:1px solid rgba(255,255,255,.06)}
        .cat-chip:hover{background:rgba(168,85,247,.15);color:#fff;border-color:rgba(168,85,247,.4);text-decoration:none}
        .cat-chip.active{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;font-weight:600;box-shadow:0 0 18px -3px rgba(168,85,247,.5)}
        .cat-chip.sub{background:transparent;border:1px dashed rgba(255,255,255,.15);font-size:12px;padding:7px 14px}
        .cat-chip.sub.active{border-color:var(--accent);border-style:solid;background:rgba(168,85,247,.12)}

        /* ===== КАРТОЧКИ ПОСТОВ (премиум) ===== */
        .posts{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;margin-bottom:64px}
        .post{position:relative;display:flex;flex-direction:column;background:linear-gradient(135deg,rgba(15,23,42,.85),rgba(30,27,75,.4));border:1px solid rgba(255,255,255,.08);border-radius:24px;overflow:hidden;transition:all .4s cubic-bezier(.16,1,.3,1);animation:post-in .6s cubic-bezier(.16,1,.3,1) backwards}
        .post:nth-child(1){animation-delay:.05s}
        .post:nth-child(2){animation-delay:.1s}
        .post:nth-child(3){animation-delay:.15s}
        .post:nth-child(4){animation-delay:.2s}
        .post:nth-child(5){animation-delay:.25s}
        .post:nth-child(6){animation-delay:.3s}
        .post:nth-child(7){animation-delay:.35s}
        .post:nth-child(8){animation-delay:.4s}
        .post:nth-child(9){animation-delay:.45s}
        @keyframes post-in{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
        .post::before{content:"";position:absolute;inset:0;border-radius:24px;padding:2px;background:linear-gradient(135deg,rgba(168,85,247,.6),rgba(236,72,153,.2) 40%,rgba(14,165,233,.4) 70%,rgba(168,85,247,.6));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.35;pointer-events:none;animation:blog-glow 3.5s ease-in-out infinite;background-size:200% 200%}
        @keyframes blog-glow{0%,100%{opacity:.25}50%{opacity:.7}}
        .post:hover{transform:translateY(-6px) scale(1.01);border-color:rgba(168,85,247,.5);box-shadow:0 20px 50px -15px rgba(168,85,247,.35),0 0 30px -5px rgba(236,72,153,.2)}
        .post:hover::before{opacity:1}
        .post-cover{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(168,85,247,.25),rgba(30,27,75,.6));display:flex;align-items:center;justify-content:center;font-size:56px;min-height:160px;aspect-ratio:16/9}
        .post-cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(2,6,23,.7) 100%)}
        .post-cover img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .post:hover .post-cover img{transform:scale(1.06)}
        .post-body{padding:24px;flex:1;display:flex;flex-direction:column;position:relative;z-index:1}
        .post-meta{display:flex;gap:10px;align-items:center;font-size:12px;color:var(--muted);margin-bottom:14px;flex-wrap:wrap}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.3px;text-transform:uppercase}
        .badge-ai{background:rgba(168,85,247,.15);color:#c4b5fd;border:1px solid rgba(168,85,247,.3)}
        .badge-human{background:rgba(52,211,153,.15);color:#6ee7b7;border:1px solid rgba(52,211,153,.3)}
        .badge-cat{background:rgba(251,191,36,.12);color:#fcd34d;border:1px solid rgba(251,191,36,.3)}
        .post h3{font-size:19px;line-height:1.35;margin-bottom:12px;color:#fff}
        .post h3 a{color:inherit;text-decoration:none}
        .post h3 a:hover{color:#fff;text-decoration:none}
        .post-excerpt{color:#94a3b8;font-size:14px;margin-bottom:18px;flex:1;line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .read-more{display:inline-flex;align-items:center;gap:6px;color:var(--accent);font-weight:600;font-size:13px;padding:8px 14px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.25);border-radius:999px;transition:all .3s;align-self:flex-start}
        .read-more:hover{background:var(--accent);color:#fff;text-decoration:none;transform:translateX(3px)}
        .cat-header{max-width:1100px;margin:0 auto 32px;padding:0 24px;position:relative;z-index:2}
        .cat-header h1{font-size:32px;margin-bottom:8px;background:linear-gradient(135deg,#fff,#c4b5fd);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
        .pagination{display:flex;justify-content:center;gap:8px;margin:40px 0}
        .pagination a,.pagination span{padding:10px 16px;border-radius:12px;font-weight:500;background:rgba(30,41,59,.5);border:1px solid rgba(255,255,255,.08);color:#cbd5e1}
        .pagination a:hover{background:rgba(168,85,247,.15);border-color:rgba(168,85,247,.4);color:#fff;text-decoration:none}
        .pagination .current{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border-color:transparent;box-shadow:0 0 18px -3px rgba(168,85,247,.5)}
        footer{background:rgba(15,23,42,.7);backdrop-filter:blur(12px);color:#94a3b8;padding:32px 0;text-align:center;font-size:14px;margin-top:80px;border-top:1px solid rgba(255,255,255,.08);position:relative;z-index:2}
        footer a{color:#fff}
        @media(max-width:640px){.container{padding:0 16px}.posts{grid-template-columns:1fr}}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
    </style>
</head>
<body>
<div class="blog-cosmos" aria-hidden="true">
    <div class="star-layer"></div>
    <div class="comet comet-1"></div>
    <div class="comet comet-2"></div>
    <div class="comet comet-3"></div>
</div>

<div class="site-header">
    <div class="sh-inner">
        <a href="/" class="sh-logo"><span>🔮</span> AI Астролог</a>
        <nav class="sh-nav">
            <a href="/horoscopes">Гороскопы</a>
            <a href="/divinations">Гадания</a>
            <a href="/calendars">Календари</a>
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
            <a href="/calendars">Календари</a>
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
        <span class="hero-eyebrow">✨ БЛОГ AI-АСТРОЛОГА</span>
        <h1>Прогнозы, энергии и мудрость звёзд</h1>
        <p>Ежедневные прогнозы, разборы энергий дня и профессиональные советы от вашего астролога-ассистента</p>
    </div>
</header>
<main class="container">@yield('content')</main>
@include('partials.site-footer')

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
