"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function SiteHeader({ showAuth = true }: { showAuth?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => setIsAdmin(!!d?.user?.is_admin))
        .catch(() => {});
    }
  }, []);

  // Закрываю меню при переходе на другую страницу
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setMenuOpen(false);
    router.push("/login");
  };

  const navLinks = [
    { href: "/horoscopes", label: "Гороскопы" },
    { href: "/divinations", label: "Гадания" },
  { href: "/calendars", label: "Календари" },
    { href: "/crystal-ball", label: "Хрустальный шар" },
    { href: "/blog", label: "Блог" },
    { href: "/pricing", label: "Тарифы" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="text-2xl">🔮</span> AI Астролог
        </Link>

        {/* Десктоп-меню */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-white transition ${pathname?.startsWith(l.href) ? "text-violet-400 font-semibold" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          {isLoggedIn && (
            <>
              <Link href="/dashboard" className="hover:text-white transition">Личный кабинет</Link>
              {isAdmin && <Link href="/admin" className="hover:text-white transition">Админка</Link>}
            </>
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
                className="hidden sm:block bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold transition text-white"
              >
                Выйти
              </button>
            </>
          ) : showAuth ? (
            <>
              <Link href="/login" className="hidden sm:block text-sm text-slate-300 hover:text-white transition">
                Войти
              </Link>
              <Link href="/register" className="hidden sm:block bg-violet-600 hover:bg-violet-500 rounded-xl px-5 py-2.5 text-sm font-semibold transition text-white">
                Регистрация
              </Link>
            </>
          ) : null}

          {/* Гамбургер для мобильных */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 hover:bg-slate-700 transition"
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 my-1 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                  pathname?.startsWith(l.href)
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}

            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition"
                >
                  Личный кабинет
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    Админка
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-semibold text-white transition text-left"
                >
                  Выйти
                </button>
              </>
            ) : showAuth ? (
              <>
                <Link
                  href="/login"
                  className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="mt-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition text-center"
                >
                  Регистрация
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
