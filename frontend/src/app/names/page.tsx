"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function NamesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [random, setRandom] = useState<any[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    fetch(`${API}/api/names/origins`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setOrigins(d?.origins || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const url = selectedOrigin 
      ? `${API}/api/names?origin=${encodeURIComponent(selectedOrigin)}`
      : `${API}/api/names`;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => setRandom(d?.names || []))
      .catch(() => {});
  }, [selectedOrigin]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/names?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(d.names || []);
        setDropOpen(true);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleGenerate = async () => {
    if (!query.trim() || query.length < 2) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const r = await fetch(`${API}/api/names/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query.trim() }),
      });
      if (r.ok) {
        const d = await r.json();
        setAiResult(d.name);
        setRandom(prev => [d.name, ...prev.filter(n => n.translit !== d.name.translit)].slice(0, 50));
      }
    } catch {}
    setAiLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-violet-400">Главная</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Значение имени</span>
        </div>

        <div className="text-center mb-10">
          <div className="pricing-eyebrow mb-4">✨ ПРОИСХОЖДЕНИЕ И ХАРАКТЕР</div>
          <div className="cal-medal mx-auto mb-5" style={{ width: "84px", height: "84px", borderRadius: "26px", ["--accent" as any]: "#a855f7" }}>
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">Значение имени</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Введите имя — AI расскажет про его происхождение, значение и характер носителей.
          </p>
        </div>

        {/* Поиск */}
        <div style={{ ["--accent" as any]: "#a855f7" }} className="home-panel p-5 sm:p-6 mb-8">
          <div className="relative z-40">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setDropOpen(true); setActiveIdx(-1); }}
                onFocus={() => setDropOpen(true)}
                onBlur={() => setTimeout(() => setDropOpen(false), 180)}
                placeholder="Введите имя (например: Андрей)"
                className="flex-1 px-5 py-3.5 bg-slate-900/60 border border-white/10 rounded-xl text-lg focus:outline-none focus:border-violet-400 backdrop-blur"
                onKeyDown={(e) => {
                  const open = dropOpen && results.length > 0;
                  if (e.key === "ArrowDown" && open) { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, Math.min(results.length, 8) - 1)); }
                  else if (e.key === "ArrowUp" && open) { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
                  else if (e.key === "Escape") { setDropOpen(false); }
                  else if (e.key === "Enter") {
                    if (open && activeIdx >= 0) { window.location.href = `/names/${results[activeIdx].translit}`; }
                    else if (open && results.length === 1) { window.location.href = `/names/${results[0].translit}`; }
                    else { handleGenerate(); }
                  }
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={aiLoading || query.length < 2}
                className="plan-btn disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 rounded-xl font-bold whitespace-nowrap"
              >
                {aiLoading ? "⏳ AI пишет..." : "✨ Узнать значение"}
              </button>
            </div>

            {/* Дропдаун: совпадения из каталога */}
            {dropOpen && query.length >= 2 && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-violet-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-violet-950/60 overflow-hidden z-50">
                {results.slice(0, 8).map((n: any, i: number) => (
                  <Link
                    key={n.translit}
                    href={`/names/${n.translit}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`flex items-center justify-between gap-3 px-5 py-3 transition ${i === activeIdx ? "bg-violet-600/30 text-white" : "hover:bg-violet-600/15 text-slate-200"}`}
                  >
                    <span className="font-semibold">{n.name}</span>
                    <span className="text-xs text-slate-400">{n.origin || ""}</span>
                  </Link>
                ))}
                <div className="px-5 py-2 text-[11px] text-slate-500 border-t border-white/5">
                  Enter — открыть · ↑↓ — навигация
                </div>
              </div>
            )}

            {/* Нет в каталоге — предлагаем AI */}
            {dropOpen && query.length >= 2 && !loading && results.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl px-5 py-3 text-sm text-slate-400 z-50">
                В каталоге такого имени нет — нажмите «✨ Узнать значение», и AI напишет толкование
              </div>
            )}
          </div>
        </div>

        {/* AI результат */}
        {aiResult && (
          <div style={{ ["--accent" as any]: "#a855f7" }} className="cal-card relative mb-8 rounded-3xl p-6 md:p-8 overflow-hidden">
            <span className="cal-shine" aria-hidden="true" />
            <div className="relative z-10 flex items-start gap-3 mb-4">
              <div className="cal-medal shrink-0" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{aiResult.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {aiResult.origin && (
                    <span className="inline-flex items-center px-3 py-1 bg-emerald-600/30 border border-emerald-500/40 rounded-full text-xs font-semibold">
                      🏛 {aiResult.origin}
                    </span>
                  )}
                  {aiResult.ai_generated && (
                    <span className="inline-block px-3 py-1 bg-violet-600/30 border border-violet-500/40 rounded-full text-xs font-semibold">
                      ✨ AI-толкование
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="quote-card" style={{ ["--accent" as any]: "#a855f7" }}><p className="text-white leading-relaxed whitespace-pre-line">{aiResult.interpretation}</p></div>
            <Link
              href={`/names/${aiResult.translit}`}
              className="plan-btn inline-block mt-6 px-6 py-2.5 rounded-xl font-bold"
            >
              Подробнее →
            </Link>
          </div>
        )}

        {/* Фильтр по происхождению */}
        {origins.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Фильтр по происхождению:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOrigin("")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  !selectedOrigin 
                    ? "bg-violet-600 text-white" 
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Все
              </button>
              {origins.map((origin) => (
                <button
                  key={origin}
                  onClick={() => setSelectedOrigin(origin)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    selectedOrigin === origin 
                      ? "bg-violet-600 text-white" 
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {origin}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Результаты поиска */}
{/* Случайные имена */}
        {!query && random.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedOrigin ? `Имена (${selectedOrigin})` : "Все имена"}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {random.map((n, i) => (
                <Link
                  key={n.translit}
                  href={`/names/${n.translit}`}
                  style={{ ["--accent" as any]: ["#a855f7", "#ec4899", "#38bdf8", "#fbbf24", "#34d399"][i % 5] }}
                  className="cal-card relative rounded-2xl p-3 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden text-center text-sm block"
                >
                  <span className="cal-shine" aria-hidden="true" />
                  <div className="relative z-10 font-medium text-white">{n.name}</div>
                  {n.origin && <div className="relative z-10 text-xs text-slate-400 mt-1">{n.origin}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
