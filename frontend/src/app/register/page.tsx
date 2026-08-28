"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HOROSCOPE_TYPES = [
  { slug: "general", name: "Общий", icon: "🔮" },
  { slug: "love", name: "Любовный", icon: "❤️" },
  { slug: "career", name: "Карьерный", icon: "💼" },
  { slug: "financial", name: "Финансовый", icon: "💰" },
  { slug: "health", name: "Здоровье", icon: "🌿" },
  { slug: "chinese", name: "Китайский", icon: "🐉" },
  { slug: "tibetan", name: "Тибетский", icon: "🏔️" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [selected, setSelected] = useState<string[]>(["general"]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleType = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) { setError("Укажите имя"); setLoading(false); return; }
    if (!email.trim() || !email.includes("@")) { setError("Укажите корректный email"); setLoading(false); return; }
    if (password.length < 6) { setError("Пароль должен быть не короче 6 символов"); setLoading(false); return; }
    if (!birthDate) { setError("Укажите дату рождения"); setLoading(false); return; }
    if (selected.length === 0) { setError("Выберите хотя бы один гороскоп"); setLoading(false); return; }
    if (!agree) { setError("Необходимо согласие с политикой конфиденциальности"); setLoading(false); return; }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: password,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_city: birthCity,
          horoscope_types: selected,
          frequency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка регистрации");
      }

      // Сохраняем токен
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Редирект в личный кабинет
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔮</div>
          <h1 className="text-3xl font-bold mb-2">Создать аккаунт</h1>
          <p className="text-slate-400">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 underline">
              Войти
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться?"
              className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
              disabled={loading}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Дата рождения *</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Время (необязательно)</label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Город (необязательно)</label>
              <input
                type="text"
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                placeholder="Москва"
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Какие гороскопы получать?</label>
            <div className="flex flex-wrap gap-2">
              {HOROSCOPE_TYPES.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleType(t.slug)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    selected.includes(t.slug)
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Как часто присылать?</label>
            <div className="flex gap-2">
              {(["daily", "weekly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    frequency === f
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {f === "daily" ? "Каждый день" : "Раз в неделю"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 accent-violet-600"
              disabled={loading}
            />
            <span>
              Я согласен с{" "}
              <Link href="/privacy" className="text-violet-400 hover:text-violet-300 underline">
                политикой конфиденциальности
              </Link>{" "}
              и офертой
            </span>
          </label>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl px-6 py-4 font-semibold text-lg transition"
          >
            {loading ? "Создание аккаунта..." : "Создать аккаунт — бесплатно"}
          </button>

          <p className="text-center text-sm text-slate-400">🎁 7 дней индивидуального гороскопа в подарок</p>
        </form>
      </div>
    </main>
  );
}
