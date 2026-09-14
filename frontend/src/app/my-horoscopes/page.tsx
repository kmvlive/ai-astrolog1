"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type PersonalHoroscope = {
  id: number;
  type: string;
  is_personal?: boolean;
  content: string;
  created_at: string;
};

export default function HoroscopesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [personalHoroscopes, setPersonalHoroscopes] = useState<PersonalHoroscope[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    fetch(`${API_URL}/api/horoscopes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setPersonalHoroscopes(data?.horoscopes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const typeNames: Record<string, string> = {
    general: "Общий",
    love: "Любовь",
    career: "Карьера",
    financial: "Финансы",
    health: "Здоровье",
    chinese: "Китайский",
    tibetan: "Тибетский",
    natal_chart: "Натальная карта",
  };

  const typeIcons: Record<string, string> = {
    general: "🔮",
    love: "❤️",
    career: "💼",
    financial: "💰",
    health: "🌿",
    chinese: "🐉",
    tibetan: "🏔️",
    natal_chart: "🌟",
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-4" />
          <div>Загрузка...</div>
        </div>
      </main>
    );
  }

  // Авторизован — показываем персональные гороскопы
  if (isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            Мои гороскопы
          </h1>
          <p className="text-slate-400 mb-8">
            Персональные прогнозы на основе вашей натальной карты
          </p>

          {personalHoroscopes.length === 0 ? (
            <div className="rounded-2xl p-8 bg-slate-900 border border-white/10 text-center">
              <div className="text-5xl mb-4">🔮</div>
              <div className="text-xl font-semibold mb-2">У вас пока нет персональных гороскопов</div>
              <div className="text-slate-400 mb-6">
                Заполните профиль — и получите первый прогноз бесплатно
              </div>
              <Link
                href="/profile"
                className="inline-block bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-semibold transition"
              >
                Заполнить профиль
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {personalHoroscopes.map((h) => (
                <Link
                  key={h.id}
                  href={`/my-horoscopes/${h.id}`}
                  className="block rounded-2xl p-6 bg-slate-900 border border-white/10 hover:border-violet-500/50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">
                        {new Date(h.created_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xl font-semibold flex items-center gap-2 flex-wrap">
                        {typeIcons[h.type] || "✨"}
                        {!(h.is_personal && h.type === "general") && (typeNames[h.type] || h.type)}
                        {h.is_personal && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            ✨ персональный
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-600 hover:text-violet-400 transition text-2xl">
                      →
                    </div>
                  </div>
                  <div className="text-slate-300 line-clamp-3">{h.content}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <SiteFooter />
      </main>
    );
  }

  // Не авторизован — показываем общий гороскоп (как было)
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Гороскоп на сегодня</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Выберите свой знак зодиака и читайте прогноз
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
          {/* Здесь должен быть fetch /api/daily-horoscopes */}
          <div className="text-center py-12 text-slate-400 col-span-full">
            Загрузка знаков...
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-3xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">🔮 Хотите персональный гороскоп?</h2>
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
          <p className="text-xs text-slate-500 mt-4">7 дней бесплатно · Без привязки карты · Отмена в 1 клик</p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
