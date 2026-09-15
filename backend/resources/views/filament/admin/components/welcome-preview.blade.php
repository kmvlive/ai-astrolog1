<div class="rounded-xl border border-amber-500/40 bg-slate-900 p-4 max-w-sm relative overflow-hidden">
    <div class="absolute top-0 left-0 right-0 h-0.5 bg-amber-500"></div>
    <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
            <span class="text-xl">{{ config('popup.welcome_icon', '✨') }}</span>
            <h4 class="font-semibold text-sm text-white">{{ config('popup.welcome_title') }}</h4>
        </div>
        <span class="text-slate-500 text-xs">✕</span>
    </div>
    <p class="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{{ config('popup.welcome_body') }}</p>
    <div class="flex gap-2 mt-3">
        @if(config('popup.welcome_link_url'))
            <span class="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-500">{{ config('popup.welcome_link_text', 'Начать') }}</span>
        @endif
        <span class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/10">{{ config('popup.welcome_dismiss_text', 'Позже') }}</span>
    </div>
</div>
<p class="text-xs text-slate-500 mt-2">↑ Так popup будет выглядеть у пользователя</p>
