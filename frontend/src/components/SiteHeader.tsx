"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SiteHeader({ showAuth = true }: { showAuth?: boolean }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="text-2xl">🔮</span> AI Астролог
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <Link href="/horoscopes" className="hover:text-white transition">Гороскопы</Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="hover:text-white transition">Личный кабинет</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:block text-sm text-slate-300 hover:text-white transition"
              >
                Дашборд
              </Link>
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold transition text-white"
              >
                Выйти
              </button>
            </>
          ) : showAuth ? (
            <>
              <Link href="/login" className="hidden sm:block text-sm text-slate-300 hover:text-white transition">
                Войти
              </Link>
              <Link href="/register" className="bg-violet-600 hover:bg-violet-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition text-white">
                Регистрация
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
