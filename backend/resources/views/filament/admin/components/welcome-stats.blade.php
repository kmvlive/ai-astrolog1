<div class="grid grid-cols-3 gap-4">
    <div class="rounded-lg bg-slate-800 p-3 text-center">
        <div class="text-2xl font-bold text-white">{{ $total }}</div>
        <div class="text-xs text-slate-400">Всего пользователей</div>
    </div>
    <div class="rounded-lg bg-green-900/30 border border-green-500/20 p-3 text-center">
        <div class="text-2xl font-bold text-green-400">{{ $shown }}</div>
        <div class="text-xs text-slate-400">Уже видели</div>
    </div>
    <div class="rounded-lg bg-amber-900/30 border border-amber-500/20 p-3 text-center">
        <div class="text-2xl font-bold text-amber-400">{{ $pending }}</div>
        <div class="text-xs text-slate-400">Увидят при входе</div>
    </div>
</div>
