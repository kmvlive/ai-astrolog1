"use client";

import CometField from "@/components/CometField";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

const SIGNS = [
  { slug: "Ari", name: "Овен", emoji: "♈" }, { slug: "Tau", name: "Телец", emoji: "♉" },
  { slug: "Gem", name: "Близнецы", emoji: "♊" }, { slug: "Can", name: "Рак", emoji: "♋" },
  { slug: "Leo", name: "Лев", emoji: "♌" }, { slug: "Vir", name: "Дева", emoji: "♍" },
  { slug: "Lib", name: "Весы", emoji: "♎" }, { slug: "Sco", name: "Скорпион", emoji: "♏" },
  { slug: "Sag", name: "Стрелец", emoji: "♐" }, { slug: "Cap", name: "Козерог", emoji: "♑" },
  { slug: "Aqu", name: "Водолей", emoji: "♒" }, { slug: "Pis", name: "Рыбы", emoji: "♓" },
];

export default function CompatibilityPage() {
  const [sign1, setSign1] = useState("Can");
  const [sign2, setSign2] = useState("Leo");
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    setContent(null);
    try {
      const r = await fetch(`${API}/api/compatibility/${sign1}/${sign2}`);
      const d = await r.json();
      setContent(d.content || "Текст готовится — попробуйте другую пару ✨");
    } catch {
      setContent("Не удалось загрузить — попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  };

  const s1 = SIGNS.find((s) => s.slug === sign1)!;
  const s2 = SIGNS.find((s) => s.slug === sign2)!;

  return (
    <main className="min-h-screen text-white relative overflow-hidden isolate">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💞</div>
          <h1 className="text-4xl font-bold mb-3">Совместимость знаков</h1>
          <p className="text-slate-400">Выберите два знака — и узнайте, что говорят звёзды о вашей паре</p>
        </div>

        <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 mb-8">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-slate-400 mb-2">Вы</div>
              <select
                value={sign1}
                onChange={(e) => setSign1(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
              >
                {SIGNS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.emoji} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-2">Партнёр</div>
              <select
                value={sign2}
                onChange={(e) => setSign2(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
              >
                {SIGNS.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.emoji} {s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-400 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition"
          >
            {loading ? "Смотрим на звёзды..." : `💘 Совместимость: ${s1.name} + ${s2.name}`}
          </button>
        </div>

        {content && (
          <div className="rounded-2xl p-8 bg-slate-900 border border-rose-500/30">
            <div className="text-center text-2xl font-bold mb-4">
              {s1.emoji} {s1.name} × {s2.emoji} {s2.name}
            </div>
            <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-line">{content}</p>
          </div>
        )}

        <div className="mt-10 rounded-2xl p-6 bg-gradient-to-r from-violet-900/40 to-amber-900/20 border border-violet-500/30 text-center">
          <p className="text-slate-300 mb-4 text-sm">
            Персональная совместимость по натальным картам — ещё глубже и точнее
          </p>
          <Link href="/pricing" className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-6 py-3 rounded-xl transition">
            Узнать подробнее
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
