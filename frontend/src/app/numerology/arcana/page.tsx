"use client";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type Card = { id: number; name: string; description: string; image?: string };

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export default function ArcanaPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/tarot-cards`)
      .then((r) => r.json())
      .then((d) => {
        setCards(d.cards || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen text-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🃏</div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-200 via-sky-200 to-amber-200 bg-clip-text text-transparent">
            22 старших аркана
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Символика, толкование и влияние каждого аркана на судьбу человека.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div key={card.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 to-slate-900/80 p-6 hover:border-violet-500/30 transition">
                {card.image ? (
                  <div className="relative w-full h-48 rounded-xl mb-4 overflow-hidden border border-white/10">
                    <img src={`/storage/${card.image}`} alt={card.name}
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_70px_35px_rgba(5,8,20,0.95)]" />
                  </div>
                ) : (
                  <div className="relative w-full h-48 rounded-xl mb-4 border border-white/10 bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-violet-950/50 overflow-hidden flex items-center justify-center">
                    <span className="cal-shine" aria-hidden="true" />
                    <div className="relative z-10 text-center">
                      <div className="text-5xl font-serif text-violet-300/50 mb-2">{ROMAN[(card.id - 1) % 22]}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">иллюстрация скоро</div>
                    </div>
                    <div className="absolute inset-3 rounded-lg border border-violet-500/15 pointer-events-none" />
                  </div>
                )}
                <div className="text-sm text-violet-300 mb-1">Аркан {card.id}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{card.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
