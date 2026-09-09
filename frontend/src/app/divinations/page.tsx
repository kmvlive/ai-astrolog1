"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AdBlock from "@/components/AdBlock";
import SiteFooter from "@/components/SiteFooter";

const DIVINATIONS = [
  {
    slug: "tarot-yes-no",
    name: "Таро Да/Нет",
    emoji: "🃏",
    desc: "Быстрый ответ на ваш вопрос — одна карта, чёткий ответ",
    gradient: "from-purple-900/40 to-indigo-900/40",
    border: "border-purple-500/30 hover:border-purple-400/60",
  },
  {
    slug: "celtic-cross",
    name: "Кельтский крест",
    emoji: "✝️",
    desc: "Классический расклад на 10 карт — глубокий анализ ситуации",
    gradient: "from-emerald-900/40 to-teal-900/40",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
  },
  {
    slug: "tarot-love",
    name: "Таро на любовь",
    emoji: "💕",
    desc: "Расклад на отношения: прошлое, настоящее, будущее любви",
    gradient: "from-rose-900/40 to-pink-900/40",
    border: "border-rose-500/30 hover:border-rose-400/60",
  },
  {
    slug: "tarot-future",
    name: "Таро на будущее",
    emoji: "🔮",
    desc: "Прогноз на неделю, месяц, полгода и год вперёд",
    gradient: "from-violet-900/40 to-purple-900/40",
    border: "border-violet-500/30 hover:border-violet-400/60",
  },
  {
    slug: "tarot-birthdate",
    name: "Таро по дате рождения",
    emoji: "⭐",
    desc: "Персональная карта и число судьбы по вашей дате рождения",
    gradient: "from-amber-900/40 to-orange-900/40",
    border: "border-amber-500/30 hover:border-amber-400/60",
  },
  {
    slug: "coffee-grounds",
    name: "На кофейной гуще",
    emoji: "☕",
    desc: "Традиционное гадание — образы и символы в чашке кофе",
    gradient: "from-stone-900/40 to-amber-950/40",
    border: "border-stone-500/30 hover:border-stone-400/60",
  },
  {
    slug: "runes",
    name: "На рунах",
    emoji: "ᚱ",
    desc: "Скандинавские руны Старшего Футарка — мудрость предков",
    gradient: "from-sky-900/40 to-blue-900/40",
    border: "border-sky-500/30 hover:border-sky-400/60",
  },
];

export default function DivinationsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
            🔮 Онлайн-гадания
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Семь древних способов заглянуть в будущее — от классического Таро до скандинавских рун.
            AI-оракул интерпретирует символы специально для вас.
          </p>
        </div>

        {/* Сетка гаданий */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DIVINATIONS.map((d) => (
            <Link
              key={d.slug}
              href={`/divinations/${d.slug}`}
              className={`group block p-6 rounded-3xl bg-gradient-to-br ${d.gradient} border ${d.border} transition hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="text-4xl mb-3">{d.emoji}</div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-white">{d.name}</h2>
              <p className="text-slate-400 text-sm mb-4 group-hover:text-slate-300">{d.desc}</p>
              <span className="text-sm font-semibold text-white/80 group-hover:text-white">
                Погадать →
              </span>
            </Link>
          ))}
        </div>

        <AdBlock />
      </div>

      <SiteFooter />
    </main>
  );
}
