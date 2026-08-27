"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const HOROSCOPE_TYPES = [
  { slug: "general", name: "Общий", icon: "🔮" },
  { slug: "love", name: "Любовный", icon: "❤️" },
  { slug: "career", name: "Карьерный", icon: "💼" },
  { slug: "financial", name: "Финансовый", icon: "💰" },
  { slug: "health", name: "Здоровье", icon: "🌿" },
  { slug: "chinese", name: "Китайский", icon: "🐉" },
  { slug: "tibetan", name: "Тибетский", icon: "🏔️" },
];

export default function RegisterPage() {
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
  const [submitted, setSubmitted] = useState(false);

  const toggleType = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Укажите имя");
    if (!email.trim() || !email.includes("@")) return setError("Укажите корректный email");
    if (password.length < 6) return setError("Пароль должен быть не короче 6 символов");
    if (!birthDate) return setError("Укажите дату рождения");
    if (selected.length === 0) return setError("Выберите хотя бы один гороскоп");
    if (!agree) return setError("Необходимо согласие с политикой конфиденциальности");

    // Временно: сервер подключим на следующем шаге.
    console.log("Регистрация:", { name, email, birthDate, birthTime, birthCity, selected, frequency });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-slate-900 border border-white/10 rounded-2xl p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Данные приняты!</h1>
          <p className="text-slate-300 mb-6">
            Форма работает! На следующем шаге подключим сервер, и аккаунт будет создаваться по-настоящему.
          </p>
          <Link href="/" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold">
            На главную
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔮</div>
          <h1 className="text-3xl font-bold mb-2">Создать аккаунт</h1>
          <p className="text-slate-400">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 underline">Войти</Link>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Время (необязательно)</label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500"
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
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    selected.includes(t.slug)
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                  }`}
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
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    frequency === f
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                  }`}
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
            className="w-full bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-4 font-semibold text-lg transition"
          >
            Создать аккаунт — бесплатно
          </button>

          <p className="text-center text-sm text-slate-400">🎁 7 дней индивидуального гороскопа в подарок</p>
        </form>
      </div>
    </main>
  );
}
