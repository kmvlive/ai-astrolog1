<x-filament-panels::page>
<style>
.an-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.an-grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px}
.an-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.an-card{border-radius:12px;background:#fff;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.dark .an-card{background:#111827}
.an-label{font-size:13px;color:#6b7280}
.an-num{font-size:28px;font-weight:700;margin-top:4px}
.an-sub{font-size:12px;color:#9ca3af;margin-top:4px}
.an-bar-bg{height:12px;border-radius:6px;background:#e5e7eb}
.an-bar{height:12px;border-radius:6px;background:#f59e0b}
.dark .an-bar-bg{background:#374151}
.an-chart{display:flex;align-items:flex-end;gap:8px;height:160px}
.an-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
.an-colbar{width:100%;border-radius:6px 6px 0 0;background:#f59e0b}
.an-table{width:100%;font-size:14px;border-collapse:collapse}
.an-table th{text-align:left;color:#6b7280;padding:8px 4px;border-bottom:1px solid #e5e7eb}
.an-table td{padding:8px 4px;border-bottom:1px solid #f3f4f6}
.dark .an-table th{border-color:#374151}.dark .an-table td{border-color:#1f2937}
@media(max-width:1024px){.an-grid2{grid-template-columns:1fr}.an-grid4{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.an-grid4{grid-template-columns:1fr}}
</style>

{{-- Карточки --}}
<div class="an-grid4">
    <div class="an-card"><div class="an-label">👥 Всего пользователей</div><div class="an-num">{{ $stats['total'] }}</div><div class="an-sub">+{{ $stats['week'] }} за неделю · +{{ $stats['month'] }} за месяц</div></div>
    <div class="an-card"><div class="an-label">✉️ Подтвердили email</div><div class="an-num">{{ $stats['confirmed'] }}</div><div class="an-sub">{{ $stats['total'] ? round($stats['confirmed'] / $stats['total'] * 100) : 0 }}% от всех</div></div>
    <div class="an-card"><div class="an-label">🔮 Персональные гороскопы</div><div class="an-num">{{ $stats['personal'] }}</div><div class="an-sub">получают ежедневно в 9:00</div></div>
    <div class="an-card"><div class="an-label">💰 Платные + Telegram</div><div class="an-num">{{ $stats['paid'] }} / {{ $stats['tg'] }}</div><div class="an-sub">подписок / в боте</div></div>
</div>

<div class="an-grid2">
    {{-- Воронка --}}
    <div class="an-card">
        <h3 style="font-weight:700;margin-bottom:16px">🎯 Воронка конверсии</h3>
        @foreach($funnel as $f)
            <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px">
                    <span>{{ $f['label'] }}</span><span style="font-weight:600">{{ $f['count'] }} ({{ $f['pct'] }}%)</span>
                </div>
                <div class="an-bar-bg"><div class="an-bar" style="width: {{ max(2, $f['pct']) }}%"></div></div>
            </div>
        @endforeach
    </div>

    {{-- Регистрации по неделям --}}
    <div class="an-card">
        <h3 style="font-weight:700;margin-bottom:16px">📈 Новые регистрации по неделям</h3>
        <div class="an-chart">
            @foreach($regWeeks as $w)
                <div class="an-col">
                    <span style="font-size:12px;font-weight:600">{{ $w['count'] }}</span>
                    <div class="an-colbar" style="height: {{ max(4, $w['height']) }}%"></div>
                    <span style="font-size:11px;color:#9ca3af">{{ $w['label'] }}</span>
                </div>
            @endforeach
        </div>
    </div>

    {{-- Топ знаков --}}
    <div class="an-card">
        <h3 style="font-weight:700;margin-bottom:16px">♈ Топ знаков зодиака</h3>
        <div class="an-grid3">
            @forelse($zodiac as $sign => $count)
                <div style="border-radius:8px;background:#f3f4f6;padding:12px;text-align:center" class="dark:bg-gray-800">
                    <div style="font-size:16px;font-weight:700">{{ $sign }}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px">{{ $count }} чел.</div>
                </div>
            @empty
                <p style="font-size:14px;color:#9ca3af">Нет данных о датах рождения</p>
            @endforelse
        </div>
    </div>

    {{-- Доставки --}}
    <div class="an-card">
        <h3 style="font-weight:700;margin-bottom:16px">📧 Статистика доставок писем</h3>
        <table class="an-table">
            <thead><tr><th>Тип</th><th>Отправлено</th><th>Ошибки</th></tr></thead>
            <tbody>
            @foreach($delivery as $r)
                <tr>
                    <td>{{ $r['event_type'] }}</td>
                    <td style="color:#16a34a;font-weight:600">{{ $r['sent'] }}</td>
                    <td style="{{ $r['failed'] > 0 ? 'color:#dc2626;font-weight:600' : 'color:#9ca3af' }}">{{ $r['failed'] }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>

{{-- Топ статей --}}
<div class="an-card" style="margin-top:24px">
    <h3 style="font-weight:700;margin-bottom:16px">🏆 Топ статей блога по просмотрам</h3>
    <table class="an-table">
        <thead><tr><th style="width:100px">👁 Просмотры</th><th>Заголовок</th><th style="width:110px">Дата</th></tr></thead>
        <tbody>
        @foreach($topPosts as $p)
            <tr>
                <td style="font-weight:700">{{ $p['views'] }}</td>
                <td>{{ \Illuminate\Support\Str::limit($p['title'], 80) }}</td>
                <td style="color:#9ca3af">{{ $p['date'] }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
</div>
</x-filament-panels::page>
