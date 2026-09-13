"use client";

import DreamsCount from "@/components/DreamsCount";
import { CALENDARS } from "@/lib/calendars";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Plan = {
  id: number;
  slug: string;
  name: string;
  formatted_price: string;
  formatted_original_price: string | null;
  duration_days: number;
  features: string[];
  popular: boolean;
};

const SIGNS = [
  { slug: "oven", name: "Овен", emoji: "♈", dates: "21.03 — 19.04" },
  { slug: "telec", name: "Телец", emoji: "♉", dates: "20.04 — 20.05" },
  { slug: "bliznecy", name: "Близнецы", emoji: "♊", dates: "21.05 — 20.06" },
  { slug: "rak", name: "Рак", emoji: "♋", dates: "21.06 — 22.07" },
  { slug: "lev", name: "Лев", emoji: "♌", dates: "23.07 — 22.08" },
  { slug: "deva", name: "Дева", emoji: "♍", dates: "23.08 — 22.09" },
  { slug: "vesy", name: "Весы", emoji: "♎", dates: "23.09 — 22.10" },
  { slug: "skorpion", name: "Скорпион", emoji: "♏", dates: "23.10 — 21.11" },
  { slug: "strelec", name: "Стрелец", emoji: "♐", dates: "22.11 — 21.12" },
  { slug: "kozerog", name: "Козерог", emoji: "♑", dates: "22.12 — 19.01" },
  { slug: "vodoley", name: "Водолей", emoji: "♒", dates: "20.01 — 18.02" },
  { slug: "ryby", name: "Рыбы", emoji: "♓", dates: "19.02 — 20.03" },
];

function zodiacSign(month: number, day: number) {
  const bounds: Record<number, [string, number][]> = {
    1: [["kozerog", 19], ["vodoley", 31]],
    2: [["vodoley", 18], ["ryby", 29]],
    3: [["ryby", 20], ["oven", 31]],
    4: [["oven", 19], ["telec", 30]],
    5: [["telec", 20], ["bliznecy", 31]],
    6: [["bliznecy", 20], ["rak", 30]],
    7: [["rak", 22], ["lev", 31]],
    8: [["lev", 22], ["deva", 31]],
    9: [["deva", 22], ["vesy", 30]],
    10: [["vesy", 22], ["skorpion", 31]],
    11: [["skorpion", 21], ["strelec", 30]],
    12: [["strelec", 21], ["kozerog", 31]],
  };
  for (const [slug, lastDay] of bounds[month]) {
    if (day <= lastDay) return SIGNS.find((s) => s.slug === slug)!;
  }
  return SIGNS[9];
}

const PERIOD_LINKS = [
  { slug: "today", name: "На сегодня", icon: "🌞", color: "from-yellow-500/20 to-orange-500/20" },
  { slug: "tomorrow", name: "На завтра", icon: "🌙", color: "from-blue-500/20 to-indigo-500/20" },
  { slug: "week", name: "На неделю", icon: "📅", color: "from-emerald-500/20 to-teal-500/20" },
  { slug: "month", name: "На месяц", icon: "🗓", color: "from-purple-500/20 to-pink-500/20" },
  { slug: "year", name: "На 2026 год", icon: "🎊", color: "from-red-500/20 to-pink-500/20" },
];

// Лунный календарь
const SYNODIC = 29.53058867;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASES = [
  { name: "Новолуние", emoji: "🌑", img: "/moon/moon-0.png" },
  { name: "Растущий серп", emoji: "🌒", img: "/moon/moon-1.png" },
  { name: "Первая четверть", emoji: "🌓", img: "/moon/moon-2.png" },
  { name: "Растущая Луна", emoji: "🌔", img: "/moon/moon-3.png" },
  { name: "Полнолуние", emoji: "🌕", img: "/moon/moon-4.png" },
  { name: "Убывающая Луна", emoji: "🌖", img: "/moon/moon-5.png" },
  { name: "Последняя четверть", emoji: "🌗", img: "/moon/moon-6.png" },
  { name: "Убывающий серп", emoji: "🌘", img: "/moon/moon-7.png" },
];

function getMoon(date: Date) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phase = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const idx = Math.floor((phase / SYNODIC) * 8 + 0.5) % 8;
  return PHASES[idx];
}

const MoonWidget = () => {
  const [phase, setPhase] = useState<typeof PHASES[0] | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setPhase(getMoon(now));
    setDateStr(now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }));
  }, []);

  if (!phase) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 pb-12">
      <Link href="/moon" className="group block max-w-2xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-900 hover:border-violet-500/60 transition shadow-xl shadow-violet-900/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={phase.img} alt={phase.name} className="w-full h-48 object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-5 pt-14">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs text-violet-300 mb-1">🌙 Фаза Луны · {dateStr}</div>
                <div className="text-2xl font-bold">{phase.emoji} {phase.name}</div>
              </div>
              <div className="text-violet-300 group-hover:text-violet-200 text-sm font-semibold whitespace-nowrap pb-1">
                Подробнее →
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
};

const FREE_SYSTEMS = [
  { slug: "chinese", name: "Китайский", emoji: "🐉" },
  { slug: "japanese", name: "Японский", emoji: "🎌" },
  { slug: "zoroastrian", name: "Зороастрийский", emoji: "🔥" },
  { slug: "druids", name: "Друидов", emoji: "🌳" },
  { slug: "flowers", name: "Цветочный", emoji: "🌸" },
  { slug: "compatibility", name: "Совместимость", emoji: "💞", href: "/horoscopes/compatibility" },
];

const FreeHoroscopesWidget = () => (
  <section className="max-w-6xl mx-auto px-4 pb-16">
    <div className="text-center mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold">Бесплатные гороскопы на сегодня</h2>
      <p className="text-slate-400 mt-2">Шесть древних систем — без подписки и регистрации</p>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {FREE_SYSTEMS.map((s) => (
        <Link
          key={s.slug}
          href={s.href || `/horoscopes/free/${s.slug}`}
          className="group rounded-2xl p-5 bg-slate-900 border border-white/10 hover:border-amber-400/50 hover:-translate-y-1 transition transform text-center"
        >
          <div className="text-4xl mb-2 group-hover:scale-110 transition">{s.emoji}</div>
          <div className="font-semibold text-sm">{s.name}</div>
          <div className="text-xs text-slate-500 mt-1">Читать →</div>
        </Link>
      ))}
    </div>
  </section>
);

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [mySign, setMySign] = useState<typeof SIGNS[0] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [affirmationTitle, setAffirmationTitle] = useState<string>("");

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
    fetch(`${API}/api/plans`)
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => {});

    fetch(`${API}/api/blog`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.posts) setBlogPosts(d.posts);
    }).catch(() => {});
  }, []);

  // Загрузка сегодняшней аффирмации
  useEffect(() => {
    fetch(`${API}/api/affirmations/today`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setAffirmationTitle(data.title);
      })
      .catch(() => {});
  }, []);

  const checkSign = () => {
    if (!birthDate) return;
    const d = new Date(birthDate);
    setMySign(zodiacSign(d.getMonth() + 1, d.getDate()));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />


      {/* HERO */}
      {!isLoggedIn && (
<section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 text-4xl opacity-20 animate-pulse">✦</div>
        <div className="absolute top-40 right-20 text-3xl opacity-20 animate-pulse" style={{ animationDelay: "0.5s" }}>✦</div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-block bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
            ✨ Искусственный интеллект + настоящая астрология
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            Ваш персональный гороскоп{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              на основе натальной карты
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Точные предсказания на каждый день: 10 планет, 12 домов, аспекты.
            Не общие фразы — а расчёт по вашей дате, времени и месту рождения.
          </p>

          <div className="max-w-md mx-auto bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <div className="text-sm text-slate-400 mb-3">Узнайте свой знак зодиака</div>
            <div className="flex gap-2">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => { setBirthDate(e.target.value); setMySign(null); }}
                className="flex-1 rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500 text-white"
              />
              <button onClick={checkSign} className="bg-violet-600 hover:bg-violet-500 rounded-xl px-5 py-3 font-semibold transition whitespace-nowrap">
                Узнать
              </button>
            </div>
            {mySign && (
              <div className="mt-4 bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                <div className="text-3xl mb-1">{mySign.emoji}</div>
                <div className="font-bold text-lg">Вы — {mySign.name}!</div>
                <div className="flex gap-2 justify-center mt-3">
                  <Link href={`/horoscopes/${mySign.slug}`} className="bg-violet-600 hover:bg-violet-500 rounded-lg px-4 py-2 text-sm font-semibold transition">
                    Гороскоп на сегодня
                  </Link>
                  <Link href="/register" className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold transition">
                    Персональный прогноз
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-500">
            <span>✓ 7 дней бесплатно</span>
            <span>✓ Без привязки карты</span>
            <span>✓ Гороскоп на email каждое утро</span>
          </div>
        </div>
      </section>

)}

            {/* ФАЗА ЛУНЫ */}
      <div className={isLoggedIn ? "pt-6 sm:pt-10" : ""}>
        

      <MoonWidget />
      </div>
      <FreeHoroscopesWidget />
      <section className="max-w-6xl mx-auto px-4 pt-4 pb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Гороскопы по знакам зодиака</h2>
        <p className="text-slate-400 mt-2">Выберите период — и читайте прогноз для своего знака</p>
      </section>

      {/* БЫСТРЫЕ ССЫЛКИ НА ПЕРИОДЫ */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {PERIOD_LINKS.map((p) => (
            <Link
              key={p.slug}
              href={`/horoscopes?period=${p.slug}`}
              className={`bg-gradient-to-br ${p.color} border border-white/10 hover:border-violet-500/50 rounded-2xl p-5 text-center transition hover:scale-105`}
            >
              <div className="text-3xl mb-2">{p.icon}</div>
              <div className="font-semibold text-sm">Гороскоп</div>
              <div className="text-xs text-slate-400">{p.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ЗНАКИ ЗОДИАКА */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Гороскоп на сегодня</h2>
        <p className="text-slate-400 text-center mb-10">Выберите знак — читайте бесплатно, без регистрации</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {SIGNS.map((sign) => (
<Link
              key={sign.slug}
              href={`/horoscopes/${sign.slug}`}
              className="group bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-violet-500/50 rounded-2xl p-4 text-center transition hover:scale-105"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition">{sign.emoji}</div>
              <div className="font-semibold text-sm">{sign.name}</div>
              <div className="text-[10px] text-slate-500 mt-1">{sign.dates}</div>
            </Link>
          ))}
        </div>
      </section>



      {/* ТАРО, БИОРИТМЫ И СОННИК */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl md:text-3xl font-bold">🔮 Гадания онлайн</h2>
            <Link href="/divinations" className="text-violet-400 hover:text-violet-300 text-sm font-semibold">
              Все гадания →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Link href="/divinations/tarot-yes-no" className="group p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-950 border border-purple-500/20 hover:border-purple-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">🃏</div>
              <div className="text-sm font-semibold">Таро Да/Нет</div>
            </Link>
            <Link href="/divinations/celtic-cross" className="group p-4 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-teal-950 border border-emerald-500/20 hover:border-emerald-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">✝️</div>
              <div className="text-sm font-semibold">Кельтский крест</div>
            </Link>
            <Link href="/divinations/tarot-love" className="group p-4 rounded-2xl bg-gradient-to-br from-rose-900/40 to-pink-950 border border-rose-500/20 hover:border-rose-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">💕</div>
              <div className="text-sm font-semibold">На любовь</div>
            </Link>
            <Link href="/divinations/tarot-future" className="group p-4 rounded-2xl bg-gradient-to-br from-violet-900/40 to-purple-950 border border-violet-500/20 hover:border-violet-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">🔮</div>
              <div className="text-sm font-semibold">На будущее</div>
            </Link>
            <Link href="/divinations/tarot-birthdate" className="group p-4 rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-950 border border-amber-500/20 hover:border-amber-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">⭐</div>
              <div className="text-sm font-semibold">По дате рождения</div>
            </Link>
            <Link href="/divinations/coffee-grounds" className="group p-4 rounded-2xl bg-gradient-to-br from-stone-900/60 to-amber-950 border border-stone-500/20 hover:border-stone-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">☕</div>
              <div className="text-sm font-semibold">Кофейная гуща</div>
            </Link>
            <Link href="/divinations/runes" className="group p-4 rounded-2xl bg-gradient-to-br from-sky-900/40 to-blue-950 border border-sky-500/20 hover:border-sky-400/50 text-center transition hover:-translate-y-1">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">ᚱ</div>
              <div className="text-sm font-semibold">На рунах</div>
            </Link>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <Link href="/crystal-ball" className="group relative overflow-hidden bg-gradient-to-br from-violet-900/50 to-indigo-950 border border-violet-500/30 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-violet-400/50">
              <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition">🔮</div>
              <div className="text-3xl mb-3">🔮</div>
              <h3 className="text-xl font-bold text-violet-200 mb-2">Хрустальный Шар</h3>
              <p className="text-slate-400 text-sm mb-4">Задайте вопрос — древний оракул откроет завесу будущего. AI-предсказание за секунды.</p>
              <span className="text-violet-400 text-sm font-semibold group-hover:text-violet-300">Спросить шар →</span>
            </Link>
            <a href="/tarot" className="group relative overflow-hidden bg-gradient-to-br from-fuchsia-900/50 to-violet-950 border border-fuchsia-500/30 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-fuchsia-400/50">
            <div className="absolute -top-8 -right-8 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition">🎴</div>
            <div className="relative">
              <div className="text-5xl mb-4">🎴</div>
              <h3 className="text-2xl font-bold mb-2">Карта Таро дня</h3>
              <p className="text-slate-300 mb-6">Послание на сегодня от колоды Старших Арканов. Одна карта — одно важное сообщение для вас.</p>
              <span className="inline-block bg-fuchsia-600 group-hover:bg-fuchsia-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">Открыть карту →</span>
            </div>
          </a>
          <a href="/biorhythms" className="group relative overflow-hidden bg-gradient-to-br from-cyan-900/50 to-slate-950 border border-cyan-500/30 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-cyan-400/50">
            <div className="absolute -top-8 -right-8 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition">📊</div>
            <div className="relative">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-2">Биоритмы сегодня</h3>
              <p className="text-slate-300 mb-6">Физическая, эмоциональная и интеллектуальная энергия на сегодня + прогноз на 30 дней по дате рождения.</p>
              <span className="inline-block bg-cyan-600 group-hover:bg-cyan-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">Рассчитать →</span>
            </div>
          </a>
          <a href="/dreams" className="group relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-slate-950 border border-indigo-500/30 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-indigo-400/50">
            <div className="absolute -top-8 -right-8 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition">🌙</div>
            <div className="relative">
              <div className="text-5xl mb-4">🌙</div>
              <h3 className="text-2xl font-bold mb-2">Сонник</h3>
              <p className="text-slate-300 mb-6"><DreamsCount /> толкований снов. Не нашли свой символ — AI растолкует его специально для вас.</p>
              <span className="inline-block bg-indigo-600 group-hover:bg-indigo-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">Растолковать сон →</span>
            </div>
          </a>
          <a href="/names" className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-indigo-950 border border-purple-500/30 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-purple-400/50">
            <div className="absolute -top-8 -right-8 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition">✨</div>
            <div className="relative">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-2xl font-bold mb-2">Значение имени</h3>
              <p className="text-slate-300 mb-6">Происхождение, значение и характер имени. AI расскажет про любое имя за секунды.</p>
              <span className="inline-block bg-purple-600 group-hover:bg-purple-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">Узнать значение →</span>
            </div>
          </a>
          <a href="/names/compatibility" className="group relative overflow-hidden bg-gradient-to-br from-pink-900/50 to-rose-950 border border-pink-500/30 rounded-3xl p-8 transition hover:-translate-y-1 hover:border-pink-400/50">
            <div className="absolute -top-8 -right-8 text-[120px] opacity-20 group-hover:opacity-30 group-hover:scale-110 transition">💕</div>
            <div className="relative">
              <div className="text-5xl mb-4">💕</div>
              <h3 className="text-2xl font-bold mb-2">Совместимость имён</h3>
              <p className="text-slate-300 mb-6">Как сочетаются два имени в любви, дружбе и работе? AI проанализирует пару за секунды.</p>
              <span className="inline-block bg-pink-600 group-hover:bg-pink-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">Проверить пару →</span>
            </div>
          </a>
        </div>
      </section>

      {/* БЛОГ */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/20 via-slate-900/40 to-violet-900/20 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <div className="text-4xl mb-3">📅</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Календари на каждый день</h2>
              <p className="text-slate-400 max-w-xl">Праздники, именины, лунные дни, православные и мусульманские даты, посадка и стрижки — всё посчитано для вас.</p>
            </div>
            <Link href="/calendars" className="shrink-0 bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition shadow-lg shadow-violet-600/30">Все календари →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {CALENDARS.map((c) => (
              <Link key={c.slug} href={`/calendars/${c.slug}`} className="group p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-violet-500/40 hover:bg-slate-900 transition text-center">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
                <div className="text-xs text-slate-300 leading-tight">{{ holidays: "Праздники", orthodox: "Православный", muslim: "Мусульманский", lunar: "Лунный", gardener: "Садовода", haircut: "Стрижки", names: "Именины", conception: "Зачатие" }[c.slug] ?? c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

            {/* Здоровье и настрой */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/affirmations" className="block bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-8 hover:border-violet-500/60 transition group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">💫 Здоровье и настрой</h2>
              <p className="text-slate-400">Ежедневные аффирмации для гармонии и вдохновения</p>
            </div>
            <span className="text-4xl text-violet-400 group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
            <div className="text-sm text-violet-300 mb-1">Сегодня</div>
            <div className="font-semibold text-white">{affirmationTitle || "Загрузка..."}</div>
          </div>
        </Link>
      </section>

<section className="bg-slate-900/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">📖 Блог AI-астролога</h2>
            <p className="text-slate-400">Энергии дня, лунные циклы и астрологические прогнозы</p>
          </div>
          {blogPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <a key={post.slug} href={post.url} className="group bg-slate-800/60 hover:bg-slate-800 border border-white/10 rounded-2xl overflow-hidden transition hover:-translate-y-1">
                  {post.cover_image ? (
                    <div className="aspect-video overflow-hidden bg-slate-900">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-violet-600/40 to-indigo-700/40 flex items-center justify-center text-5xl">✨</div>
                  )}
                  <div className="p-5">
                    <div className="text-xs text-violet-400 mb-2">{post.published_at}</div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-violet-300 transition">{post.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">{post.excerpt}</p>
                    <span className="text-violet-400 text-sm font-semibold group-hover:text-violet-300">Читать →</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">Статьи загружаются...</div>
          )}
          <div className="text-center mt-10">
            <a href="/blog" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition">
              Все статьи блога →
            </a>
          </div>
        </div>
      </section>

      {/* КАК РАБОТАЕТ */}
{!isLoggedIn && (
      <section id="how" className="bg-slate-900/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📝</div>
              <div className="text-violet-400 text-sm font-semibold mb-2">ШАГ 1</div>
              <h3 className="text-xl font-bold mb-3">Регистрация за 30 секунд</h3>
              <p className="text-slate-400">Укажите дату, время и город рождения — мы построим вашу натальную карту по швейцарским эфемеридам.</p>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🧠</div>
              <div className="text-violet-400 text-sm font-semibold mb-2">ШАГ 2</div>
              <h3 className="text-xl font-bold mb-3">ИИ анализирует карту</h3>
              <p className="text-slate-400">Нейросеть изучает 10 планет в 12 домах, ретроградность и аспекты — и пишет прогноз именно для вас.</p>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📬</div>
              <div className="text-violet-400 text-sm font-semibold mb-2">ШАГ 3</div>
              <h3 className="text-xl font-bold mb-3">Гороскоп каждое утро</h3>
              <p className="text-slate-400">Читайте в личном кабинете или получайте на email в 8:00. Любовь, карьера, финансы, здоровье.</p>
            </div>
          </div>
        </div>
      </section>

      )}

      {/* ПРЕИМУЩЕСТВА */}
{!isLoggedIn && (
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Почему нам доверяют</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex gap-4 bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl">🎯</div>
            <div>
              <h3 className="font-bold mb-1">Настоящая астрология</h3>
              <p className="text-slate-400 text-sm">Расчёты по швейцарским эфемеридам (Swiss Ephemeris) — те же данные, что используют профессиональные астрологи.</p>
            </div>
          </div>
          <div className="flex gap-4 bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-bold mb-1">ИИ вместо шаблонов</h3>
              <p className="text-slate-400 text-sm">Каждый гороскоп уникален: нейросеть пишет текст на основе именно ваших планет, а не общих фраз для знака.</p>
            </div>
          </div>
          <div className="flex gap-4 bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl">🔒</div>
            <div>
              <h3 className="font-bold mb-1">Приватность</h3>
              <p className="text-slate-400 text-sm">Данные рождения хранятся в зашифрованном виде и не передаются третьим лицам.</p>
            </div>
          </div>
          <div className="flex gap-4 bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="text-3xl">⚡</div>
            <div>
              <h3 className="font-bold mb-1">Мгновенно</h3>
              <p className="text-slate-400 text-sm">Натальная карта и первый гороскоп — сразу после регистрации. Без ожидания и «консультантов».</p>
            </div>
          </div>
        </div>
      </section>

      )}

      {/* Финальный CTA */}
{!isLoggedIn && (
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">🌟</div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Звёзды уже знают ваше завтра</h2>
        <p className="text-slate-400 text-lg mb-8">Присоединяйтесь — первый персональный гороскоп будет готов через минуту после регистрации.</p>
        <Link href="/register" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-10 py-4 text-lg font-semibold transition shadow-lg shadow-violet-600/30">
          Создать аккаунт бесплатно →
        </Link>
      </section>

      )}

      <SiteFooter />
    </main>
  );
}
