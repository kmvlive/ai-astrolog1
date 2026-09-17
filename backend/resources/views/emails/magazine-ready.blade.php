@php
    $date = $issue->issue_date->translatedFormat('d F Y');
    $user_name = $issue->content['meta']['user_name'] ?? '';
    $url = url('/magazine/' . $issue->uuid);
    $c = $issue->content;
@endphp
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#020617">
<tr><td align="center" style="padding:40px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border:1px solid rgba(251,191,36,.3);border-radius:20px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:24px;text-align:center">
    <div style="color:#0f172a;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:6px">Персональный выпуск</div>
    <div style="color:#0f172a;font-size:36px;font-weight:900;letter-spacing:-1px;font-family:Georgia,serif">AI АСТРОЛОГ</div>
    <div style="color:#0f172a;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-top:6px">{{ $date }}</div>
</td></tr>
<tr><td style="padding:40px 32px">
    <h1 style="color:#fff;font-size:24px;margin:0 0 12px;font-weight:700">
        {{ $user_name ? "Привет, {$user_name}!" : "Привет!" }} ✨
    </h1>
    <p style="color:#cbd5e1;font-size:16px;line-height:1.7;margin:0 0 24px">
        Ваш персональный журнал готов. Внутри — гороскоп на сегодня, аффирмация, карта дня и много интересного.
    </p>

    @if($c['horoscope'] ?? null)
    <div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:14px;padding:20px;margin-bottom:20px">
        <div style="color:#fbbf24;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:8px">⭐ Главная статья</div>
        <div style="color:#fff;font-size:15px;line-height:1.6">{{ Str::limit($c['horoscope']['content'] ?? '', 200) }}</div>
    </div>
    @endif

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
        <tr>
            @if($c['affirmation'] ?? null)
            <td style="width:50%;padding:8px">
                <div style="background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.3);border-radius:12px;padding:16px">
                    <div style="color:#a78bfa;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:6px">💫 Аффирмация</div>
                    <div style="color:#fff;font-size:13px;line-height:1.5">{{ Str::limit($c['affirmation']['title'], 50) }}</div>
                </div>
            </td>
            @endif
            @if($c['tarot'] ?? null)
            <td style="width:50%;padding:8px">
                <div style="background:rgba(236,72,153,.12);border:1px solid rgba(236,72,153,.3);border-radius:12px;padding:16px">
                    <div style="color:#f0abfc;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:6px">🎴 Карта дня</div>
                    <div style="color:#fff;font-size:13px;line-height:1.5">{{ $c['tarot']['name'] }}</div>
                </div>
            </td>
            @endif
        </tr>
        @if($c['biorhythms'] ?? null)
        <tr>
            <td colspan="2" style="padding:8px">
                <div style="background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.25);border-radius:12px;padding:16px">
                    <div style="color:#7dd3fc;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:10px">📊 Биоритмы</div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="text-align:center"><div style="color:#94a3b8;font-size:11px">Физ</div><div style="color:#34d399;font-size:22px;font-weight:700">{{ $c['biorhythms']['physical'] >= 0 ? '+' : '' }}{{ $c['biorhythms']['physical'] }}%</div></td>
                            <td style="text-align:center"><div style="color:#94a3b8;font-size:11px">Эмоц</div><div style="color:#f0abfc;font-size:22px;font-weight:700">{{ $c['biorhythms']['emotional'] >= 0 ? '+' : '' }}{{ $c['biorhythms']['emotional'] }}%</div></td>
                            <td style="text-align:center"><div style="color:#94a3b8;font-size:11px">Инт</div><div style="color:#60a5fa;font-size:22px;font-weight:700">{{ $c['biorhythms']['intellectual'] >= 0 ? '+' : '' }}{{ $c['biorhythms']['intellectual'] }}%</div></td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
        @endif
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:8px 0">
            <a href="{{ $url }}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:999px;font-weight:700;font-size:16px;box-shadow:0 0 20px -4px rgba(168,85,247,.5)">
                Открыть ваш журнал →
            </a>
        </td></tr>
    </table>
</td></tr>
<tr><td style="padding:24px 32px;background:rgba(2,6,23,.5);text-align:center;font-size:12px;color:#64748b;border-top:1px solid rgba(255,255,255,.05)">
    © AI Астролог · <a href="{{ url('/') }}" style="color:#a78bfa;text-decoration:none">my.neiro-astro.ru</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
