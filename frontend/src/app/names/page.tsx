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
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Значение имени</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Введите имя — AI расскажет про его происхождение, значение и характер носителей.
          </p>
        </div>

        {/* Поиск */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите имя (например: Андрей)"
              className="w-full px-6 py-4 bg-slate-900 border border-violet-500/30 rounded-2xl text-lg focus:outline-none focus:border-violet-400 transition"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={aiLoading || query.length < 2}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl font-semibold transition"
            >
              {aiLoading ? "⏳ AI пишет..." : "✨ Узнать значение"}
            </button>
          </div>
        </div>

        {/* AI результат */}
        {aiResult && (
          <div className="mb-8 bg-gradient-to-br from-violet-900/30 to-slate-900 border border-violet-500/30 rounded-3xl p-6 md:p-8">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">✨</span>
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
            <p className="text-slate-200 leading-relaxed whitespace-pre-line">{aiResult.interpretation}</p>
            <Link
              href={`/names/${aiResult.translit}`}
              className="inline-block mt-6 bg-violet-600 hover:bg-violet-500 px-6 py-2.5 rounded-xl font-semibold transition"
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
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Найдено: {results.length}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map((n) => (
                <Link
                  key={n.translit}
                  href={`/names/${n.translit}`}
                  className="p-4 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-violet-500/40 rounded-xl transition text-center"
                >
                  <div className="font-semibold">{n.name}</div>
                  {n.origin && <div className="text-xs text-slate-400 mt-1">{n.origin}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Случайные имена */}
        {!query && random.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedOrigin ? `Имена (${selectedOrigin})` : "Все имена"}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {random.map((n) => (
                <Link
                  key={n.translit}
                  href={`/names/${n.translit}`}
                  className="p-3 bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-violet-500/40 rounded-xl transition text-center text-sm"
                >
                  <div className="font-medium">{n.name}</div>
                  {n.origin && <div className="text-xs text-slate-400 mt-1">{n.origin}</div>}
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
