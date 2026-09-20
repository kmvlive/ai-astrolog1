"use client";

import CometField from "@/components/CometField";
import TarotCard from "@/components/TarotCard";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function TarotPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/tarot/today`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Авто-раскрытие карты через 1.2 сек
  useEffect(() => {
    if (data?.card && !revealed) {
      const t = setTimeout(() => setRevealed(true), 1200);
      return () => clearTimeout(t);
    }
  }, [data, revealed]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">🎴 Открываю карту дня...</div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const card = data?.card;

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate aura-top" style={{ ["--accent" as any]: "#a855f7" }}>
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-violet-200 to-purple-200 bg-clip-text text-transparent mb-3">
            Карта дня
          </h1>
          <p className="text-slate-400">Послание Таро на {data?.date}</p>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Нажмите на карту, чтобы перевернуть</p>
        </div>

        {card ? (
          <>
            {/* КАРТА */}
            <div className="flex justify-center mb-12">
              <div className={revealed ? "tarot-reveal" : ""}>
                <TarotCard
                  image={card.image}
                  name={card.name}
                  size="lg"
                  flipOnClick
                  initialFlipped={false}
                />
              </div>
            </div>

            {/* ТЕКСТ */}
            <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/30 to-indigo-950/40 p-8 sm:p-10 overflow-hidden">
              <span className="cal-shine" aria-hidden="true" />
              <div className="relative z-10 space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-violet-300 mb-2">Значение карты</div>
                  <h2 className="text-2xl font-bold text-white mb-3">{card.name}</h2>
                  <p className="text-slate-200 leading-relaxed text-lg">{card.description}</p>
                </div>

                <div className="border-t border-violet-500/20 pt-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-amber-300 mb-2">✨ Послание на сегодня</div>
                  <p className="text-white text-lg leading-relaxed font-medium">{card.meaning_today}</p>
                </div>

                <div className="text-xs text-slate-500 italic pt-4">
                  Карта дня обновляется каждое утро и одинакова для всех посетителей
                </div>
              </div>
            </div>

            <div className="mt-10">
              <ShareButtons
                title={`Карта дня: ${card.name}`}
                text={`${card.name} — ${card.meaning_today.slice(0, 120)}...`}
              />
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/numerology/arcana"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 font-semibold transition shadow-lg shadow-violet-500/20"
              >
                🎴 Все 22 карты Старших Арканов →
              </Link>
            </div>
          </>
        ) : (
          <div className="relative rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">
            Не удалось загрузить карту дня
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
