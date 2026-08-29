"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Sign = {
  slug: string;
  name: string;
  emoji: string;
};

const SIGN_DATES = {
  oven: "21 марта — 19 апреля",
  telec: "20 апреля — 20 мая",
  bliznecy: "21 мая — 20 июня",
  rak: "21 июня — 22 июля",
  lev: "23 июля — 22 августа",
  deva: "23 августа — 22 сентября",
  vesy: "23 сентября — 22 октября",
  skorpion: "23 октября — 21 ноября",
  strelec: "22 ноября — 21 декабря",
  kozerog: "22 декабря — 19 января",
  vodoley: "20 января — 18 февраля",
  ryby: "19 февраля — 20 марта",
};

export default function HoroscopesPage() {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

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
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Гороскоп на {date && new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Выберите свой знак зодиака и узнайте, что звёзды приготовили для вас сегодня
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
            {signs.map((sign) => (
              <Link
                key={sign.slug}
                href={`/horoscopes/${sign.slug}`}
                className="group relative bg-gradient-to-br from-slate-900 to-slate-800 hover:from-violet-900/40 hover:to-indigo-900/40 border border-white/10 hover:border-violet-500/50 rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="text-5xl mb-3">{sign.emoji}</div>
                <h3 className="text-xl font-semibold mb-1">{sign.name}</h3>
                <p className="text-xs text-slate-500">
                  {SIGN_DATES[sign.slug as keyof typeof SIGN_DATES] || ""}
                </p>
                <div className="absolute top-4 right-4 text-slate-600 group-hover:text-violet-400 transition">
                  →
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA блок */}
        <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            🔮 Хотите персональный гороскоп?
          </h2>
          <p className="text-slate-300 mb-6 text-lg">
            Общие прогнозы учитывают только ваш знак. <strong className="text-violet-300">Персональный гороскоп</strong> строится на вашей натальной карте — точное время и место рождения, положение всех 10 планет в домах.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-violet-600 hover:bg-violet-500 rounded-xl px-8 py-4 font-semibold text-lg transition shadow-lg shadow-violet-600/30"
            >
              ✨ Получить бесплатно
            </Link>
            <Link
              href="/login"
              className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl px-8 py-4 font-semibold text-lg transition"
            >
              Войти в аккаунт
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            7 дней бесплатно · Без привязки карты · Отмена в 1 клик
          </p>
        </div>
      </div>
    </main>
  );
}
