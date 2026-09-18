"use client";

import CometField from "@/components/CometField";
import PersonalUpsell from "@/components/PersonalUpsell";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type System = {
  slug: string; name: string; emoji: string; description: string;
  signs: { slug: string; name: string; emoji: string }[];
};

const ACCENTS = ["#f87171", "#fbbf24", "#4ade80", "#a78bfa", "#38bdf8", "#f472b6", "#fb7185"];

export default function FreeHoroscopesPage() {
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    fetch(`${API}/api/free-horoscopes/systems`)
      .then((r) => r.json())
      .then((d) => setSystems(d.systems || []))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent mb-4">
            Бесплатные гороскопы
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Шесть древних систем предсказаний — выберите свою и читайте прогноз на сегодня без подписки
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {systems.map((s, i) => (
            <Link
              key={s.slug}
              href={`/horoscopes/free/${s.slug}`}
              style={{ ["--accent" as any]: ACCENTS[i % ACCENTS.length] }}
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden hover:border-white/15 hover:-translate-y-1 transition"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="relative z-10">
                <div className="cal-medal mb-4" style={{ width: "56px", height: "56px", borderRadius: "16px" }}>
                  <span className="text-3xl">{s.emoji}</span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-amber-200 transition">{s.name}</h2>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{s.description}</p>
                <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  {s.signs.length} знаков · Читать сегодня →
                </div>
              </div>
            </Link>
          ))}

          <Link
            href="/horoscopes/compatibility"
            className="group relative rounded-2xl p-6 bg-gradient-to-br from-rose-950/50 to-slate-900/80 border border-rose-500/20 overflow-hidden hover:border-rose-400/50 hover:-translate-y-1 transition"
          >
            <span className="cal-shine" aria-hidden="true" />
            <div className="relative z-10">
              <div className="cal-medal mb-4" style={{ width: "56px", height: "56px", borderRadius: "16px" }}>
                <span className="text-3xl">💞</span>
              </div>
              <h2 className="text-xl font-bold mb-2 text-white group-hover:text-rose-300 transition">Совместимость знаков</h2>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">Проверьте, насколько вы подходите друг другу по знакам зодиака</p>
              <div className="text-sm font-semibold text-rose-400">Выбрать пару →</div>
            </div>
          </Link>
        </div>

        <PersonalUpsell />
      </div>
      <SiteFooter />
    </main>
  );
}
