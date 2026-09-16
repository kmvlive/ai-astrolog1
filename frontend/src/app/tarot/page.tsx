"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButtons from "@/components/ShareButtons";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function TarotPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/tarot/today`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">🎴 Открываю карту дня...</div>
      </div>
      <SiteFooter />
    </main>
  );

  const card = data?.card;

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎴</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Карта дня</h1>
          <p className="text-slate-400">Послание Таро на {data?.date}</p>
        </div>

        {card ? (
          <>
            <div className="bg-gradient-to-br from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl mb-8">
              <div className="text-center">
                <div className="inline-block bg-gradient-to-br from-violet-600/30 to-indigo-800/30 border border-violet-400/30 rounded-2xl px-8 py-12 mb-8">
                  <div className="text-7xl mb-4">🎴</div>
                  <h2 className="text-3xl font-bold text-violet-200">{card.name}</h2>
                </div>

                <div className="space-y-6 text-left">
                  <div>
                    <div className="text-sm text-violet-400 font-semibold uppercase tracking-wider mb-2">Значение карты</div>
                    <p className="text-lg text-slate-200 leading-relaxed">{card.description}</p>
                  </div>

                  <div className="border-t border-violet-500/20 pt-6">
                    <div className="text-sm text-violet-400 font-semibold uppercase tracking-wider mb-2">✨ Послание на сегодня</div>
                    <p className="text-lg text-white leading-relaxed font-medium">{card.meaning_today}</p>
                  </div>
                </div>

                <div className="mt-10 text-sm text-slate-500 italic">
                  Карта дня обновляется каждое утро и одинакова для всех посетителей
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-center font-semibold mb-4">Поделиться картой</h3>
              <ShareButtons title={`Карта дня: ${card.name} — ${card.meaning_today.slice(0, 100)}...`} />
            </div>
          </>
        ) : (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            Не удалось загрузить карту дня
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
