"use client";

import CometField from "@/components/CometField";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareBlock from "@/components/ShareBlock";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export const dynamic = 'force-dynamic';

function CompatibilityContent() {
  const searchParams = useSearchParams();
  const [name1, setName1] = useState(searchParams.get("name1") || "");
  const [name2, setName2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!name1.trim() || !name2.trim()) {
      setError("Введите оба имени");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch(`${API}/api/names/compatibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name1: name1.trim(), name2: name2.trim() }),
      });
      if (r.ok) {
        const d = await r.json();
        setResult(d);
      } else {
        setError("Не удалось проверить совместимость");
      }
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-violet-400">Главная</Link>
          <span className="mx-2">/</span>
          <Link href="/names" className="hover:text-violet-400">Значение имени</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Совместимость</span>
        </div>

        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Совместимость имён</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            AI проанализирует совместимость двух имён: как они сочетаются в отношениях, дружбе, работе.
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-900/30 to-slate-900 border border-pink-500/30 rounded-3xl p-6 md:p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Первое имя</label>
              <input
                type="search" autoComplete="off" autoCapitalize="sentences" data-lpignore="true"
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                placeholder="Например: Александр"
                className="w-full px-4 py-3 bg-slate-900 border border-pink-500/30 rounded-xl focus:outline-none focus:border-pink-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Второе имя</label>
              <input
                type="search" autoComplete="off" autoCapitalize="sentences" data-lpignore="true"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="Например: Анна"
                className="w-full px-4 py-3 bg-slate-900 border border-pink-500/30 rounded-xl focus:outline-none focus:border-pink-400 transition"
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
            </div>
          </div>
          <button
            onClick={handleCheck}
            disabled={loading || !name1.trim() || !name2.trim()}
            className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition"
          >
            {loading ? "⏳ AI анализирует..." : "💕 Проверить совместимость"}
          </button>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>

        {result && (
          <div className="bg-gradient-to-br from-pink-900/30 to-slate-900 border border-pink-500/30 rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">
              {result.name1} 💕 {result.name2}
            </h2>
            <div className="text-slate-200 leading-relaxed whitespace-pre-line">
              {result.analysis}
            </div>
            <span className="inline-block mt-6 px-3 py-1 bg-pink-600/30 border border-pink-500/40 rounded-full text-xs font-semibold">
              ✨ AI-анализ
            </span>
            <div className="mt-6 pt-6 border-t border-white/10">
              <ShareBlock title={`Совместимость имён ${result.name1} и ${result.name2} — AI-анализ | AI Астролог`} />
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

export default function CompatibilityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Загрузка...</div>}>
      <CompatibilityContent />
    </Suspense>
  );
}
