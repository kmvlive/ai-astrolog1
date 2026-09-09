"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type System = {
  slug: string; name: string; emoji: string; description: string;
  signs: { slug: string; name: string; emoji: string }[];
};

export default function FreeHoroscopesPage() {
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    fetch(`${API}/api/free-horoscopes/systems`)
      .then((r) => r.json())
      .then((d) => setSystems(d.systems || []))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            Бесплатные гороскопы
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Шесть древних систем предсказаний — выберите свою и читайте прогноз на сегодня без подписки
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {systems.map((s) => (
            <Link
              key={s.slug}
              href={`/horoscopes/free/${s.slug}`}
              className="group rounded-2xl p-6 bg-slate-900 border border-white/10 hover:border-amber-400/50 hover:-translate-y-1 transition transform"
            >
              <div className="text-5xl mb-4">{s.emoji}</div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-amber-300 transition">{s.name}</h2>
              <p className="text-sm text-slate-400 mb-4">{s.description}</p>
              <div className="text-sm font-semibold text-violet-400">{s.signs.length} знаков · Читать сегодня →</div>
            </Link>
          ))}

          <Link
            href="/horoscopes/compatibility"
            className="group rounded-2xl p-6 bg-gradient-to-br from-rose-900/40 to-slate-900 border border-rose-500/30 hover:border-rose-400/60 hover:-translate-y-1 transition transform"
          >
            <div className="text-5xl mb-4">💞</div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-rose-300 transition">Совместимость знаков</h2>
            <p className="text-sm text-slate-400 mb-4">Проверьте, насколько вы подходите друг другу по знакам зодиака</p>
            <div className="text-sm font-semibold text-rose-400">Выбрать пару →</div>
          </Link>
        </div>

        <div className="mt-16 rounded-2xl p-8 bg-gradient-to-r from-violet-900/40 to-amber-900/20 border border-violet-500/30 text-center">
          <h2 className="text-2xl font-bold mb-3">✨ Хотите прогноз только для вас?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Персональный гороскоп по дате, времени и месту рождения — точнее любого общего прогноза
          </p>
          <Link href="/pricing" className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-8 py-3 rounded-xl transition">
            Получить персональный гороскоп
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
