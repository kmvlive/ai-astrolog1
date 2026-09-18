"use client";

import CometField from "@/components/CometField";

import DreamsCount from "@/components/DreamsCount";
import RetrogradeWidget from "@/components/RetrogradeWidget";
import { CALENDARS } from "@/lib/calendars";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useEffect, useState } from "react";
import Link from "next/link";
const ACCENTS_HOME: Record<string, Record<string, string>> = {
  free: { chinese: "#dc2626", japanese: "#f59e0b", zoroastrian: "#f97316", druids: "#16a34a", flowers: "#ec4899", compatibility: "#a855f7" },
  periods: { today: "#fbbf24", tomorrow: "#3b82f6", week: "#10b981", month: "#a855f7", year: "#ef4444" },
  tools: { "crystal-ball": "#8b5cf6", tarot: "#d946ef", biorhythms: "#06b6d4", dreams: "#6366f1", names: "#a855f7", compatibility: "#ec4899" },
};



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
    <section className="max-w-6xl mx-auto px-4 pb-12 relative">
      {/* Кометы */}
      <div className="moon-comets">
        <div className="star-layer" />
        <div className="comet comet-1" />
        <div className="comet comet-2" />
        <div className="comet comet-3" />
      </div>
      <Link href="/moon" className="group block max-w-2xl mx-auto relative z-10">
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
          style={{ ["--accent" as any]: ACCENTS_HOME.free[s.slug] || "#fbbf24" }}
          className="cal-card group relative rounded-2xl p-5 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center"
        >
          <span className="cal-shine" aria-hidden="true" />
          <div className="cal-medal mb-2" style={{ width: "60px", height: "60px", borderRadius: "18px" }}>
            <span className="text-3xl">{s.emoji}</span>
          </div>
          <div className="relative z-10 font-semibold text-sm">{s.name}</div>
          <div className="relative z-10 cal-go mt-2" style={{ width: "28px", height: "28px", fontSize: "0.85rem" }}>→</div>
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
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />


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
              style={{ ["--accent" as any]: ACCENTS_HOME.periods[p.slug] || "#a78bfa" }}
              className="cal-card group relative rounded-2xl p-5 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden text-center"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="cal-medal mb-2 mx-auto" style={{ width: "56px", height: "56px", borderRadius: "16px" }}>
                <span className="text-2xl">{p.icon}</span>
              </div>
              <div className="relative z-10 font-semibold text-sm">Гороскоп</div>
              <div className="relative z-10 text-xs text-slate-400">{p.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ЗНАКИ ЗОДИАКА */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2">Гороскоп на сегодня</h2>
        <p className="text-slate-400 text-center mb-10">Выберите знак — читайте бесплатно, без регистрации</p>
        <div className="zodiac-grid-compact grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {SIGNS.map((sign) => (
            <Link
              key={sign.slug}
              href={`/horoscopes/${sign.slug}`}
              className="zodiac-card group relative bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 rounded-2xl p-4 text-center overflow-hidden block"
            >
              <span className="zodiac-card-star zodiac-card-star-1">✦</span>
              <span className="zodiac-card-star zodiac-card-star-2">✧</span>
              <span className="zodiac-card-star zodiac-card-star-3">✦</span>
              <div className="zodiac-card-emoji">{sign.emoji}</div>
              <div className="font-semibold text-sm mt-2">{sign.name}</div>
              <div className="zodiac-card-dates mt-1">{sign.dates}</div>
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
            {[
              { slug: "tarot-yes-no", emoji: "🃏", name: "Таро Да/Нет", accent: "#a855f7" },
              { slug: "celtic-cross", emoji: "✝️", name: "Кельтский крест", accent: "#34d399" },
              { slug: "tarot-love", emoji: "💕", name: "На любовь", accent: "#fb7185" },
              { slug: "tarot-future", emoji: "🔮", name: "На будущее", accent: "#8b5cf6" },
              { slug: "tarot-birthdate", emoji: "⭐", name: "По дате рождения", accent: "#fbbf24" },
              { slug: "coffee-grounds", emoji: "☕", name: "Кофейная гуща", accent: "#d97706" },
              { slug: "runes", emoji: "ᚱ", name: "На рунах", accent: "#38bdf8" },
            ].map((d) => (
              <Link
                key={d.slug}
                href={`/divinations/${d.slug}`}
                style={{ ["--accent" as any]: d.accent }}
                className="cal-card group relative rounded-2xl p-4 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden text-center"
              >
                <span className="cal-shine" aria-hidden="true" />
                <div className="cal-medal mb-2 mx-auto" style={{ width: "52px", height: "52px", borderRadius: "16px" }}>
                  <span className="text-2xl">{d.emoji}</span>
                </div>
                <div className="relative z-10 text-sm font-semibold">{d.name}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { href: "/crystal-ball", emoji: "🔮", title: "Хрустальный Шар", accent: "#8b5cf6", cta: "Спросить шар", desc: <>Задайте вопрос — древний оракул откроет завесу будущего. AI-предсказание за секунды.</> },
            { href: "/tarot", emoji: "🎴", title: "Карта Таро дня", accent: "#d946ef", cta: "Открыть карту", desc: <>Послание на сегодня от колоды Старших Арканов. Одна карта — одно важное сообщение для вас.</> },
            { href: "/biorhythms", emoji: "📊", title: "Биоритмы сегодня", accent: "#06b6d4", cta: "Рассчитать", desc: <>Физическая, эмоциональная и интеллектуальная энергия на сегодня + прогноз на 30 дней по дате рождения.</> },
            { href: "/dreams", emoji: "🌙", title: "Сонник", accent: "#6366f1", cta: "Растолковать сон", desc: <><DreamsCount /> толкований снов. Не нашли свой символ — AI растолкует его специально для вас.</> },
            { href: "/names", emoji: "✨", title: "Значение имени", accent: "#a855f7", cta: "Узнать значение", desc: <>Происхождение, значение и характер имени. AI расскажет про любое имя за секунды.</> },
            { href: "/names/compatibility", emoji: "💕", title: "Совместимость имён", accent: "#ec4899", cta: "Проверить пару", desc: <>Как сочетаются два имени в любви, дружбе и работе? AI проанализирует пару за секунды.</> },
          ].map((t) => (
            <a
              key={t.href}
              href={t.href}
              style={{ ["--accent" as any]: t.accent }}
              className="cal-card group relative p-7 rounded-3xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 flex flex-col overflow-hidden"
            >
              <span className="cal-watermark" aria-hidden="true">{t.emoji}</span>
              <span className="cal-shine" aria-hidden="true" />
              <div className="cal-medal mb-5">
                <span className="cal-card-emoji text-3xl">{t.emoji}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{t.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{t.desc}</p>
              <div className="flex items-center justify-between">
                <span className="cal-card-arrow">{t.cta}</span>
                <span className="cal-go">→</span>
              </div>
            </a>
          ))}
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
            {CALENDARS.map((c) => {
              const accents: Record<string, string> = {
                holidays: "#f472b6", orthodox: "#fbbf24", muslim: "#34d399",
                lunar: "#a78bfa", gardener: "#4ade80", haircut: "#e879f9",
                names: "#38bdf8", conception: "#fb7185"
              };
              return (
                <Link
                  key={c.slug}
                  href={`/calendars/${c.slug}`}
                  style={{ ["--accent" as any]: accents[c.slug] || "#a78bfa" }}
                  className="cal-card group relative rounded-2xl p-4 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden text-center"
                >
                  <span className="cal-shine" aria-hidden="true" />
                  <div className="cal-medal mb-2 mx-auto" style={{ width: "52px", height: "52px", borderRadius: "16px" }}>
                    <span className="text-2xl">{c.emoji}</span>
                  </div>
                  <div className="relative z-10 text-xs text-slate-300 leading-tight">{{ holidays: "Праздники", orthodox: "Православный", muslim: "Мусульманский", lunar: "Лунный", gardener: "Садовода", haircut: "Стрижки", names: "Именины", conception: "Зачатие" }[c.slug] ?? c.name}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Нумерология */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-900/20 via-slate-900/40 to-violet-900/20 p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔢</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Нумерология и эзотерика</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Раскройте тайны судьбы через числа и арканы Таро</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/numerology/matrix"
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-900/80 to-amber-950/40 border border-white/5 overflow-hidden hover:border-amber-500/30 transition-all"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-4xl mb-4">🔮</div>
                <h3 className="text-xl font-bold text-white mb-2">Матрица судьбы</h3>
                <p className="text-sm text-slate-400 mb-4">Расчёт по дате рождения: ваш жизненный путь, таланты и кармические задачи</p>
                <span className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all">
                  Рассчитать →
                </span>
              </div>
            </Link>

            <Link
              href="/numerology/compatibility"
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-900/80 to-pink-950/40 border border-white/5 overflow-hidden hover:border-pink-500/30 transition-all"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-4xl mb-4">💕</div>
                <h3 className="text-xl font-bold text-white mb-2">Матрица совместимости</h3>
                <p className="text-sm text-slate-400 mb-4">Гармония в паре: точки соприкосновения и зоны роста по датам рождения</p>
                <span className="inline-flex items-center gap-2 text-pink-400 font-semibold text-sm group-hover:gap-3 transition-all">
                  Проверить →
                </span>
              </div>
            </Link>

            <Link
              href="/numerology/arcana"
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-900/80 to-violet-950/40 border border-white/5 overflow-hidden hover:border-violet-500/30 transition-all"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-4xl mb-4">🃏</div>
                <h3 className="text-xl font-bold text-white mb-2">Значения арканов</h3>
                <p className="text-sm text-slate-400 mb-4">22 старших аркана Таро: символика, толкование и влияние на судьбу</p>
                <span className="inline-flex items-center gap-2 text-violet-400 font-semibold text-sm group-hover:gap-3 transition-all">
                  Узнать →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

            {/* Здоровье и настрой */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/affirmations"
          style={{ ["--accent" as any]: "#a855f7" }}
          className="home-panel group block p-8 md:p-10"
        >
          <span className="cal-shine" aria-hidden="true" />
          <div className="relative z-10 flex items-start justify-between mb-6 gap-4">
            <div>
              <div className="cal-medal mb-4" style={{ width: "64px", height: "64px", borderRadius: "20px" }}>
                <span className="text-3xl">💫</span>
              </div>
              <h2 className="text-3xl font-bold mb-2 text-white">Здоровье и настрой</h2>
              <p className="text-slate-400">Ежедневные аффирмации для гармонии и вдохновения</p>
            </div>
            <span className="cal-go shrink-0 mt-2">→</span>
          </div>
          <div className="quote-card relative z-10">
            <div className="text-sm mb-1 text-violet-300">Аффирмация сегодня</div>
            <div className="font-semibold text-white text-lg">{affirmationTitle || "Загрузка..."}</div>
          </div>
        </Link>
      </section>


      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">☿ Ретроградные планеты</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Узнайте какие планеты сейчас в ретроградном движении и как это влияет на вашу жизнь
          </p>
        </div>
        <RetrogradeWidget />
      </section>

<section className="bg-slate-900/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 flex items-center justify-center gap-3"><span>📖</span><span className="bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">Блог AI-астролога</span></h2>
            <p className="text-slate-400">Энергии дня, лунные циклы и астрологические прогнозы</p>
          </div>
          {blogPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {blogPosts.map((post, i) => (
                <a key={post.slug} href={post.url} style={{ ["--accent" as any]: ["#fbbf24", "#a855f7", "#38bdf8"][i % 3] }} className="cal-card group relative bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                  {post.cover_image ? (
                    <div className="aspect-video overflow-hidden bg-slate-900">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-violet-600/40 to-indigo-700/40 flex items-center justify-center text-5xl">✨</div>
                  )}
                  <span className="cal-shine" aria-hidden="true" />
                  <div className="p-5 flex flex-col flex-1 relative z-10">
                    <div className="text-xs text-violet-400 mb-2">{post.published_at}</div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-violet-300 transition">{post.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="cal-card-arrow">Читать</span>
                      <span className="cal-go" style={{ width: "30px", height: "30px", fontSize: "0.85rem" }}>→</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">Статьи загружаются...</div>
          )}
          <div className="text-center mt-10">
            <a href="/blog" className="cta-btn">
              Все статьи блога →
            </a>
          </div>
        </div>
      </section>

      {/* КАК РАБОТАЕТ */}
{!isLoggedIn && (
      <section id="how" className="bg-slate-900/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-sky-200 via-violet-200 to-emerald-200 bg-clip-text text-transparent">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 1, emoji: "📝", accent: "#38bdf8", title: "Регистрация за 30 секунд", desc: "Укажите дату, время и город рождения — мы построим вашу натальную карту по швейцарским эфемеридам." },
              { n: 2, emoji: "🧠", accent: "#a855f7", title: "ИИ анализирует карту", desc: "Нейросеть изучает 10 планет в 12 домах, ретроградность и аспекты — и пишет прогноз именно для вас." },
              { n: 3, emoji: "📬", accent: "#34d399", title: "Гороскоп каждое утро", desc: "Читайте в личном кабинете или получайте на email в 8:00. Любовь, карьера, финансы, здоровье." },
            ].map((s) => (
              <div
                key={s.n}
                style={{ ["--accent" as any]: s.accent }}
                className="cal-card relative rounded-3xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 p-8 text-center overflow-hidden"
              >
                <span className="step-num">{s.n}</span>
                <span className="cal-shine" aria-hidden="true" />
                <div className="cal-medal mb-4 mx-auto">
                  <span className="cal-card-emoji text-3xl">{s.emoji}</span>
                </div>
                <div className="relative z-10 inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                  ШАГ {s.n}
                </div>
                <h3 className="relative z-10 text-xl font-bold mb-3 text-white">{s.title}</h3>
                <p className="relative z-10 text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      )}

      {/* ПРЕИМУЩЕСТВА */}
{!isLoggedIn && (
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-pink-200 via-violet-200 to-amber-200 bg-clip-text text-transparent">Почему нам доверяют</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { emoji: "🎯", accent: "#f472b6", title: "Настоящая астрология", desc: "Расчёты по швейцарским эфемеридам (Swiss Ephemeris) — те же данные, что используют профессиональные астрологи." },
            { emoji: "🤖", accent: "#a855f7", title: "ИИ вместо шаблонов", desc: "Каждый гороскоп уникален: нейросеть пишет текст на основе именно ваших планет, а не общих фраз для знака." },
            { emoji: "🔒", accent: "#34d399", title: "Приватность", desc: "Данные рождения хранятся в зашифрованном виде и не передаются третьим лицам." },
            { emoji: "⚡", accent: "#fbbf24", title: "Мгновенно", desc: "Натальная карта и первый гороскоп — сразу после регистрации. Без ожидания и «консультантов»." },
          ].map((f) => (
            <div
              key={f.title}
              style={{ ["--accent" as any]: f.accent }}
              className="cal-card relative flex gap-4 rounded-3xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 p-6 overflow-hidden"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="cal-medal shrink-0" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
                <span className="text-2xl">{f.emoji}</span>
              </div>
              <div className="relative z-10">
                <h3 className="font-bold mb-1 text-white">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      )}

      {/* Финальный CTA */}
{!isLoggedIn && (
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div
          style={{ ["--accent" as any]: "#a855f7" }}
          className="home-panel relative p-10 md:p-14"
        >
          <span className="cal-watermark" aria-hidden="true">🌟</span>
          <span className="cal-shine" aria-hidden="true" />
          <div className="relative z-10">
            <div className="cal-medal mb-6 mx-auto" style={{ width: "84px", height: "84px", borderRadius: "26px" }}>
              <span className="text-4xl">🌟</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">Звёзды уже знают ваше завтра</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">Присоединяйтесь — первый персональный гороскоп будет готов через минуту после регистрации.</p>
            <Link href="/register" className="cta-btn">
              Создать аккаунт бесплатно →
            </Link>
          </div>
        </div>
      </section>

      )}

      <SiteFooter />
    </main>
  );
}
