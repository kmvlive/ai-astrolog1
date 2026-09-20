"use client";

import CometField from "@/components/CometField";

import DreamsCount from "@/components/DreamsCount";
import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButtons from "@/components/ShareButtons";

const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'',
    'э':'e','ю':'yu','я':'ya'
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('');
};


const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function DreamsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [random, setRandom] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/dreams`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setRandom(d?.symbols || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/dreams?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setResults(d.symbols || []);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const interpret = async (kw: string, fullSymbol?: any) => {
    setSelected({ keyword: kw, interpretation: fullSymbol?.interpretation || null });
    if (fullSymbol?.interpretation) return;

    setAiLoading(true);
    try {
      const r = await fetch(`${API}/api/dreams/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: kw }),
      });
      const d = await r.json();
      setSelected({ keyword: d.keyword || kw, interpretation: d.interpretation, ai: d.ai });
    } catch {
      setSelected({ keyword: kw, interpretation: "Не удалось растолковать. Попробуйте позже." });
    }
    setAiLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="pricing-eyebrow mb-4">🌙 ТОЛКОВАНИЕ СНОВ</div>
          <div className="cal-medal mx-auto mb-5" style={{ width: "84px", height: "84px", borderRadius: "26px", ["--accent" as any]: "#6366f1" }}>
            <span className="text-4xl">🌙</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Сонник</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Толкование снов из базы <DreamsCount /> символов. Если слова нет — AI растолкует его специально для вас.
          </p>
        </div>

        {/* Поиск */}
        <div style={{ ["--accent" as any]: "#6366f1" }} className="home-panel p-4 sm:p-6 mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите, что вам приснилось..."
              className="w-full px-5 py-4 bg-slate-900/60 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500 text-lg pr-12 "
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-2xl"
              >×</button>
            )}
          </div>

          {/* Результаты поиска */}
          {loading && (
            <div className="mt-4 text-center text-slate-400">Ищу...</div>
          )}

          {query.length >= 2 && !loading && (
            <div className="mt-4 space-y-2">
              {results.length > 0 ? (
                results.map(r => (
                  <Link
                    key={r.id || r.keyword}
                    href={`/dreams/${transliterate(r.keyword)}`}
                    className="w-full text-left px-5 py-3 bg-slate-800/50 hover:bg-violet-900/30 border border-white/5 hover:border-violet-500/30 rounded-xl transition flex items-center justify-between group"
                  >
                    <span className="font-semibold capitalize group-hover:text-violet-300">{r.keyword}</span>
                    <span className="text-sm text-slate-500 group-hover:text-violet-400">→</span>
                  </Link>
                ))
              ) : (
                <button
                  onClick={() => interpret(query)}
                  className="cta-btn w-full justify-start gap-3 text-left"
                >
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="font-semibold">Спросить AI про «{query}»</div>
                    <div className="text-sm text-slate-400">Символа нет в базе — AI растолкует специально для вас</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Облако тегов (когда поиск пустой) */}
        {query.length < 2 && !selected && (
          <div style={{ ["--accent" as any]: "#a855f7" }} className="home-panel p-6">
            <h3 className="text-center text-sm uppercase tracking-wider text-slate-300 mb-4">Популярные символы</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {random.map((s, i) => (
                <Link
                  key={i}
                  href={`/dreams/${transliterate(s.keyword)}`}
                  className="dash-chip capitalize"
                >
                  {s.keyword}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Карточка толкования */}
        {selected && (
          <div style={{ ["--accent" as any]: "#6366f1" }} className="cal-card relative rounded-3xl p-8 sm:p-10 mt-8 overflow-hidden">
            <span className="cal-shine" aria-hidden="true" />
            <span className="cal-watermark" aria-hidden="true">🌙</span>
            <div className="relative z-10 flex items-start justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-3xl font-bold capitalize text-white">{selected.keyword}</h2>
              {selected.ai && (
                <span className="relative z-10 px-3 py-1 bg-violet-600/30 border border-violet-500/40 rounded-full text-xs font-semibold">
                  ✨ AI-толкование
                </span>
              )}
            </div>

            {aiLoading ? (
              <div className="relative z-10 text-slate-400 animate-pulse text-lg">AI думает о вашем сне...</div>
            ) : selected.interpretation ? (
              <div className="relative z-10">
                <div className="quote-card mb-6" style={{ ["--accent" as any]: "#6366f1" }}>
                  <p className="text-lg text-white leading-relaxed">{selected.interpretation}</p>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-sm text-slate-400 mb-3">Поделиться</h4>
                  <ShareButtons title={`Сонник: к чему снится ${selected.keyword}. ${selected.interpretation.slice(0, 100)}...`} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
