"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";
import SubscriptionSettings from "@/components/SubscriptionSettings";

type Horoscope = {
  id: number;
  type: string;
  content: string;
  natal_data: {
    sun_sign: string;
    moon_sign: string;
    ascendant: string;
    planets?: Record<string, any>;
  };
  created_at: string;
};

const TYPES = [
  { slug: "general", name: "Общий", icon: "🔮" },
  { slug: "love", name: "Любовь", icon: "❤️" },
  { slug: "career", name: "Карьера", icon: "💼" },
  { slug: "financial", name: "Финансы", icon: "💰" },
  { slug: "health", name: "Здоровье", icon: "🌿" },
];

const SIGNS_RU: Record<string, string> = {
  Ari: "Овен ♈", Tau: "Телец ♉", Gem: "Близнецы ♊",
  Can: "Рак ♋", Leo: "Лев ♌", Vir: "Дева ♍",
  Lib: "Весы ♎", Sco: "Скорпион ♏", Sag: "Стрелец ♐",
  Cap: "Козерог ♑", Aqu: "Водолей ♒", Pis: "Рыбы ♓",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("general");
  const [error, setError] = useState("");

  // Форма профиля
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthCity, setBirthCity] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setSavingProfile(true);
    setProfileError("");

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          birth_date: birthDate,
          birth_time: birthTime,
          birth_city: birthCity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Ошибка сохранения");
      }

      // Обновляем локального пользователя
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      setProfileError(err.message || "Ошибка сохранения профиля");
    } finally {
      setSavingProfile(false);
    }
  };

  const generateHoroscope = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setGenerating(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/horoscope/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ type: selectedType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Ошибка генерации");
      }

      setHoroscope(data.horoscope);
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
        {/* ===== Секция управления подписками ===== */}
        <div className="max-w-2xl mx-auto mt-12">
          <SubscriptionSettings />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const hasBirthData = user.profile?.birth_date && user.profile?.latitude;

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Личный кабинет</h1>
            <p className="text-slate-400">Добро пожаловать, {user.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            Выйти
          </button>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">Ваш профиль</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Имя</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            {user.profile?.birth_date && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Дата рождения</div>
                <div className="font-medium">
                  {new Date(user.profile.birth_date).toLocaleDateString("ru-RU")}
                  {user.profile.birth_time && ` в ${user.profile.birth_time.substring(0, 5)}`}
                </div>
              </div>
            )}
            {user.profile?.city && (
              <div>
                <div className="text-sm text-slate-400 mb-1">Город</div>
                <div className="font-medium">{user.profile.city}</div>
              </div>
            )}
          </div>
        </div>

        {!hasBirthData && (
          <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold mb-2">✨ Заполните данные рождения</h2>
            <p className="text-slate-300 mb-4">
              Для точного расчёта гороскопа нам нужно знать, когда и где вы родились.
            </p>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Дата рождения</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Время рождения</label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Если не знаете — укажите примерно</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Город рождения</label>
                <input
                  type="text"
                  value={birthCity}
                  onChange={(e) => setBirthCity(e.target.value)}
                  placeholder="Например: Москва"
                  required
                  className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>

              {profileError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                  {profileError}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 rounded-xl px-6 py-3 font-semibold transition"
              >
                {savingProfile ? "Сохранение..." : "Сохранить данные"}
              </button>
            </form>
          </div>
        )}

        {hasBirthData && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold mb-4">🔮 Получить гороскоп</h2>

            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Выберите тип гороскопа:</div>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => setSelectedType(t.slug)}
                    disabled={generating}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                      selectedType === t.slug
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                    }`}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            <button
              onClick={generateHoroscope}
              disabled={generating}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl px-6 py-4 font-semibold text-lg transition"
            >
              {generating ? "⏳ Звёзды считаются..." : "✨ Получить гороскоп на сегодня"}
            </button>
          </div>
        )}

        {horoscope && (
          <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔮</span>
              <h2 className="text-2xl font-bold">Ваш гороскоп</h2>
              <span className="ml-auto text-sm text-slate-400">
                {new Date(horoscope.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>

            {horoscope.natal_data && (
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-slate-900/50 rounded-xl">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Солнце</div>
                  <div className="font-semibold text-violet-300">
                    {SIGNS_RU[horoscope.natal_data.sun_sign] || horoscope.natal_data.sun_sign}
                  </div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Луна</div>
                  <div className="font-semibold text-violet-300">
                    {SIGNS_RU[horoscope.natal_data.moon_sign] || horoscope.natal_data.moon_sign}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Асцендент</div>
                  <div className="font-semibold text-violet-300">
                    {SIGNS_RU[horoscope.natal_data.ascendant] || horoscope.natal_data.ascendant}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 text-slate-100 leading-relaxed whitespace-pre-line">
              {horoscope.content}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">🎁 Пробный период</h2>
          <p className="text-slate-300 mb-4">
            У вас осталось <span className="text-violet-400 font-bold">7 дней</span> бесплатного доступа ко всем функциям.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition"
          >
            Оформить подписку
          </Link>
        </div>
      </div>
        {/* ===== Секция управления подписками ===== */}
        <div className="max-w-2xl mx-auto mt-12">
          <SubscriptionSettings />
        </div>
    </main>
  );
}
