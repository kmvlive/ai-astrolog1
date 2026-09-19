"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CometField from "@/components/CometField";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Rune = {
  slug: string;
  image: string;
  name: string;
  glyph: string;
  element: string;
  meaning: string;
  advice: string;
};

const ELEMENT_RU: Record<string, string> = {
  fire: "🔥 Огонь", ice: "❄️ Лёд", storm: "⚡ Гроза",
  water: "💧 Вода", earth: "🌿 Земля", air: "💨 Воздух",
};

export default function RunesPage() {
  const [runes, setRunes] = useState<Rune[]>([]);
  const [todaySlug, setTodaySlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<Rune | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/runes`)
      .then((r) => r.json())
      .then((d) => {
        setRunes(d.runes ?? []);
        setTodaySlug(d.today ?? null);
        const today = (d.runes ?? []).find((r: Rune) => r.slug === d.today);
        if (today) setSelected(today);
      })
      .catch(() => {});
  }, []);

  const isToday = selected?.slug === todaySlug;

  const share = async () => {
    if (!selected) return;
    const text = `🪨 Руна дня ${selected.name} (${selected.glyph})\n\n${selected.meaning}\n\n💡 ${selected.advice}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Руна ${selected.name}`, text }); return; } catch {}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300">Главная</Link>
          {" → "}
          <span className="text-slate-300">Руны</span>
        </div>

        <div className="text-center mb-10">
          <div className="text-6xl mb-4">ᚱ</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Руны Старшего Футарка
          </h1>
          <p className="text-slate-400 text-lg">Руна дня и мудрость всех 24 рун</p>
        </div>

        {/* Выбранная руна (по умолчанию — руна дня) */}
        {selected && (
          <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-indigo-950/40 p-6 sm:p-8 overflow-hidden mb-12">
            <span className="cal-shine" aria-hidden="true" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* Карта руны */}
              <div className="relative shrink-0">
                <div className="absolute -inset-5 rounded-[10px] bg-violet-700/20 blur-2xl opacity-80"></div>
                <div className="relative rounded-[6px] p-[3px] bg-gradient-to-br from-amber-200 via-amber-600 to-amber-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
                  <div className="rounded-[4px] bg-[#1a1430] p-2">
                    <div className="rounded-[3px] p-[1.5px] bg-gradient-to-br from-amber-300/80 via-amber-500/60 to-amber-800/80">
                      <div className="relative aspect-[7/10] w-48 sm:w-60 overflow-hidden rounded-[2px] bg-[#0a0715]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/storage/${selected.image}`}
                          alt={`Руна ${selected.name}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(8,5,26,0.65)]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                  {isToday ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold uppercase tracking-wider">
                      🪨 Руна дня
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const t = runes.find((r) => r.slug === todaySlug);
                        if (t) setSelected(t);
                      }}
                      className="px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 text-slate-300 text-xs hover:bg-slate-700 transition"
                    >
                      ← Вернуться к руне дня
                    </button>
                  )}
                  <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-200 text-xs">
                    {ELEMENT_RU[selected.element] ?? selected.element}
                  </span>
                </div>

                <div className="flex items-baseline gap-4 justify-center md:justify-start mb-4">
                  <h2 className="text-4xl sm:text-5xl font-bold">{selected.name}</h2>
                  <span className="text-4xl bg-gradient-to-br from-amber-200 to-amber-500 bg-clip-text text-transparent">
                    {selected.glyph}
                  </span>
                </div>

                <p className="text-white/90 text-lg leading-relaxed mb-3">{selected.meaning}</p>
                <p className="text-violet-200 italic mb-6">💡 {selected.advice}</p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <button
                    onClick={share}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition"
                  >
                    {copied ? "✅ Скопировано!" : "📋 Поделиться руной"}
                  </button>
                  <Link
                    href="/divinations/runes"
                    className="px-5 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-medium transition"
                  >
                    ᚱ Погадать на рунах
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Каталог 24 рун */}
        <h3 className="text-xl font-bold mb-6 text-center">
          <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
            Все 24 руны Футарка
          </span>
        </h3>
        <p className="text-xs text-slate-500 text-center mb-8">нажмите на руну, чтобы узнать её значение</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {runes.map((r) => (
            <button
              key={r.slug}
              onClick={() => {
                setSelected(r);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group relative rounded-xl overflow-hidden border transition ${
                selected?.slug === r.slug
                  ? "border-amber-400/70 shadow-lg shadow-amber-900/40"
                  : "border-white/10 hover:border-amber-400/40"
              }`}
            >
              <div className="relative aspect-[7/10] bg-[#0a0715]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/storage/${r.image}`}
                  alt={r.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {r.slug === todaySlug && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-[9px] font-bold text-slate-950 uppercase">
                    дня
                  </span>
                )}
              </div>
              <div className="px-2 py-2 bg-slate-900/90 text-center">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-200 transition">
                  {r.name} <span className="text-amber-400/80">{r.glyph}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
