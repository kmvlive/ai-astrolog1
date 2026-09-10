<footer style="border-top:1px solid rgba(255,255,255,.1); padding:32px 0; margin-top:48px;">
    <div style="max-width:1152px; margin:0 auto; padding:0 16px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px;">
            <div style="display:flex; align-items:center; gap:8px; font-size:14px; color:#94a3b8;">
                <span style="font-size:20px;">🔮</span> AI Астролог © 2026
            </div>
            <nav style="display:flex; flex-wrap:wrap; justify-content:center; gap:24px; font-size:14px;">
                @foreach(\Illuminate\Support\Facades\Cache::remember('footer_menu_items', 3600, fn () => \App\Models\FooterMenuItem::where('is_active', true)->orderBy('sort_order')->get(['title', 'url', 'open_in_new_tab'])) as $item)
                    <a href="{{ $item->url }}" @if($item->open_in_new_tab) target="_blank" rel="noopener noreferrer" @endif style="color:#94a3b8; text-decoration:none;">{{ $item->title }}</a>
                @endforeach
            </nav>
        </div>
        <div style="font-size:12px; color:#64748b; text-align:center; padding-top:24px; border-top:1px solid rgba(255,255,255,.05); line-height:1.6;">
            <p style="margin:0 0 8px;">2014-2026 ИП Прокопенко А.В., ИНН 263211995820, свидетельство от 17.10.2007.</p>
            <p style="margin:0 0 8px;"><strong>Внимание:</strong> все права на использование материалов портала принадлежат владельцу сервиса. Копирование материалов, опубликованных на портале, запрещено. <a href="/terms" style="color:#94a3b8; text-decoration:underline;">Условия оказания услуг доступны на этой странице</a>.</p>
            <p style="margin:0;">Портал может содержать информацию и материалы, предназначенные для пользователей старше 18 лет.</p>
        </div>
    </div>
</footer>
