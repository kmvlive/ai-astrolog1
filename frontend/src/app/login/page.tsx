"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) return setError("Укажите корректный email");
    if (password.length < 6) return setError("Пароль должен быть не короче 6 символов");
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔮</div>
          <h1 className="text-3xl font-bold mb-2">Войти в аккаунт</h1>
          <p className="text-slate-400">Нет аккаунта? <Link href="/register" className="text-violet-400 hover:text-violet-300 underline">Создать</Link></p>
        </div>

        {submitted ? (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Вход выполнен!</h2>
            <p className="text-slate-300 mb-6">Форма работает! На следующем шаге подключим сервер аутентификации.</p>
            <Link href="/" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold">На главную</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ваш пароль" className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 outline-none focus:border-violet-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="checkbox" className="accent-violet-600" />
                <span>Запомнить меня</span>
              </label>
              <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300">Забыли пароль?</Link>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-4 font-semibold text-lg transition">Войти</button>
          </form>
        )}
      </div>
    </main>
  );
}
