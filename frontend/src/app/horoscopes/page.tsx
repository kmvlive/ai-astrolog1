"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AdBlock from "@/components/AdBlock";
import SiteFooter from "@/components/SiteFooter";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

const PERIODS = [
  { slug: "today", name: "Сегодня", icon: "🌞" },
  { slug: "tomorrow", name: "Завтра", icon: "🌙" },
  { slug: "week", name: "Неделя", icon: "📅" },
  { slug: "month", name: "Месяц", icon: "🗓" },
  { slug: "year", name: "Год", icon: "🎊" },
];

const PERIOD_LABELS: Record<string, string> = {
  today: "на сегодня",
  tomorrow: "на завтра",
  week: "на неделю",
  month: "на месяц",
  year: "на год",
};

export default function HoroscopesPage() {
  const [signs, setSigns] = useState<any[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  useEffect(() => {
    fetch(`${API_URL}/api/daily-horoscopes`)
      .then((r) => r.json())
      .then((data) => {
        setSigns(data.signs || []);
        setDate(data.date || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-block text-6xl mb-4 animate-pulse">🔮</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
            Гороскоп {PERIOD_LABELS[selectedPeriod]}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Выберите свой знак зодиака — звёзды уже написали для вас прогноз
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {PERIODS.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedPeriod(p.slug)}
              className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition ${
                selectedPeriod === p.slug
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-900 border-white/10 text-slate-300 hover:border-violet-500/50"
              }`}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
            {signs.map((sign) => (
              <Link
                key={sign.slug}
                href={`/horoscopes/${sign.slug}?period=${selectedPeriod}`}
                className="zodiac-card group relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/40 border border-white/5 rounded-2xl p-6 block"
              >
                {/* Плавающие звёздочки */}
                <span className="zodiac-card-star zodiac-card-star-1">✦</span>
                <span className="zodiac-card-star zodiac-card-star-2">✧</span>
                <span className="zodiac-card-star zodiac-card-star-3">✦</span>
                
                {/* Внутреннее свечение при hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 pointer-events-none" />
                
                {/* Контент */}
                <div className="relative text-center">
                  <div className="zodiac-card-emoji mb-3">{sign.emoji}</div>
                  <h3 className="text-xl font-bold mb-1 text-white group-hover:text-violet-200 transition">
                    {sign.name}
                  </h3>
                  <p className="zodiac-card-dates mb-2">
                    {sign.dates || ""}
                  </p>
                  <div className="inline-flex items-center gap-1 text-xs text-violet-300/70 group-hover:text-violet-300 transition">
                    <span>{PERIOD_LABELS[selectedPeriod]}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <AdBlock />
      </div>
      <SiteFooter />
    </main>
  );
}
