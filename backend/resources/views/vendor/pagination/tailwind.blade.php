@if ($paginator->hasPages())
<style>
  .ai-pager{display:flex;align-items:center;justify-content:center;gap:6px;margin:28px 0;flex-wrap:wrap;font-family:Inter,system-ui,sans-serif}
  .ai-pager a,.ai-pager span{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;padding:0 12px;border-radius:10px;font-size:14px;text-decoration:none;transition:.15s}
  .ai-pager a{background:#fff;border:1px solid #e6e4f0;color:#4b465c}
  .ai-pager a:hover{border-color:#7c5cff;color:#7c5cff}
  .ai-pager .cur{background:#7c5cff;border:1px solid #7c5cff;color:#fff;font-weight:600}
  .ai-pager .dis{opacity:.45;pointer-events:none;background:#fff;border:1px solid #e6e4f0;color:#4b465c}
  .ai-pager .info{width:100%;text-align:center;color:#8a8798;font-size:13px;margin-bottom:6px}
</style>
<nav class="ai-pager" role="navigation" aria-label="Пагинация">
    <span class="info">Показано {{ $paginator->firstItem() }}–{{ $paginator->lastItem() }} из {{ $paginator->total() }}</span>
    @if ($paginator->onFirstPage())
        <span class="dis">‹ Назад</span>
    @else
        <a href="{{ $paginator->previousPageUrl() }}" rel="prev">‹ Назад</a>
    @endif
    @foreach ($elements as $element)
        @if (is_string($element))
            <span class="dis">…</span>
        @endif
        @if (is_array($element))
            @foreach ($element as $page => $url)
                @if ($page == $paginator->currentPage())
                    <span class="cur">{{ $page }}</span>
                @else
                    <a href="{{ $url }}">{{ $page }}</a>
                @endif
            @endforeach
        @endif
    @endforeach
    @if ($paginator->hasMorePages())
        <a href="{{ $paginator->nextPageUrl() }}" rel="next">Вперёд ›</a>
    @else
        <span class="dis">Вперёд ›</span>
    @endif
</nav>
@endif
