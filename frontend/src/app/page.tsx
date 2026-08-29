"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [mySign, setMySign] = useState<typeof SIGNS[0] | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
  }, []);

  const checkSign = () => {
    if (!birthDate) return;
    const d = new Date(birthDate);
    setMySign(zodiacSign(d.getMonth() + 1, d.getDate()));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">🔮</span> AI Астролог
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link href="/horoscopes" className="hover:text-white transition">Гороскопы</Link>
            <a href="#how" className="hover:text-white transition">Как работает</a>
            <a href="#pricing" className="hover:text-white transition">Тарифы</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">
                Личный кабинет
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm text-slate-300 hover:text-white transition">
                  Войти
                </Link>
                <Link href="/register" className="bg-violet-600 hover:bg-violet-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 text-4xl opacity-20 animate-pulse">✦</div>
        <div className="absolute top-40 right-20 text-3xl opacity-20 animate-pulse" style={{ animationDelay: "0.5s" }}>✦</div>
        <div className="absolute bottom-20 left-1/4 text-2xl opacity-10 animate-pulse" style={{ animationDelay: "1s" }}>✦</div>

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

          {/* Интерактив: узнай свой знак */}
          <div className="max-w-md mx-auto bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur">
            <div className="text-sm text-slate-400 mb-3">Узнайте свой знак зодиака</div>
            <div className="flex gap-2">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => { setBirthDate(e.target.value); setMySign(null); }}
                className="flex-1 rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500 text-white"
              />
              <button
                onClick={checkSign}
                className="bg-violet-600 hover:bg-violet-500 rounded-xl px-5 py-3 font-semibold transition whitespace-nowrap"
              >
                Узнать
              </button>
            </div>
            {mySign && (
              <div className="mt-4 bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                <div className="text-3xl mb-1">{mySign.emoji}</div>
                <div className="font-bold text-lg">Вы — {mySign.name}!</div>
                <div className="flex gap-2 justify-center mt-3">
                  <Link
                    href={`/horoscopes/${mySign.slug}`}
                    className="bg-violet-600 hover:bg-violet-500 rounded-lg px-4 py-2 text-sm font-semibold transition"
                  >
                    Гороскоп на сегодня
                  </Link>
                  <Link
                    href="/register"
                    className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold transition"
                  >
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

      {/* ===== ЗНАКИ ЗОДИАКА ===== */}
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

      {/* ===== КАК РАБОТАЕТ ===== */}
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

      {/* ===== ПРЕИМУЩЕСТВА ===== */}
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

      {/* ===== ТАРИФЫ ===== */}
      <section id="pricing" className="bg-slate-900/50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Простые тарифы</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Пробный</h3>
              <div className="text-4xl font-bold mb-4">0 ₽ <span className="text-base text-slate-400 font-normal">/ 7 дней</span></div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li>✓ Персональные гороскопы — все 5 типов</li>
                <li>✓ Натальная карта с расшифровкой</li>
                <li>✓ Утренние письма на email</li>
                <li>✓ Общие гороскопы без ограничений</li>
              </ul>
              <Link href="/register" className="block text-center bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl px-6 py-3 font-semibold transition">
                Начать бесплатно
              </Link>
            </div>
            <div className="relative bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border border-violet-500/40 rounded-2xl p-8">
              <div className="absolute -top-3 right-6 bg-violet-600 rounded-full px-3 py-1 text-xs font-bold">ПОПУЛЯРНЫЙ</div>
              <h3 className="text-xl font-bold mb-1">Подписка</h3>
              <div className="text-4xl font-bold mb-4">299 ₽ <span className="text-base text-slate-400 font-normal">/ месяц</span></div>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li>✓ Всё из пробного периода</li>
                <li>✓ Прогнозы на неделю и месяц</li>
                <li>✓ Совместимость с партнёром</li>
                <li>✓ Приоритетная генерация ИИ</li>
              </ul>
              <Link href="/register" className="block text-center bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition shadow-lg shadow-violet-600/30">
                Попробать 7 дней бесплатно
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">🌟</div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Звёзды уже знают ваше завтра</h2>
        <p className="text-slate-400 text-lg mb-8">Присоединяйтесь — первый персональный гороскоп будет готов через минуту после регистрации.</p>
        <Link
          href="/register"
          className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-10 py-4 text-lg font-semibold transition shadow-lg shadow-violet-600/30"
        >
          Создать аккаунт бесплатно →
        </Link>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span> AI Астролог © 2026
          </div>
          <div className="flex gap-6">
            <Link href="/horoscopes" className="hover:text-white transition">Гороскопы</Link>
            <Link href="/login" className="hover:text-white transition">Войти</Link>
            <Link href="/register" className="hover:text-white transition">Регистрация</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
