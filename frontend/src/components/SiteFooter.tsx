"use client";

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔮</span> AI Астролог © 2026
        </div>
        <div className="flex gap-6">
          <Link href="/horoscopes" className="hover:text-white transition">Гороскопы</Link>
          <Link href="/dashboard" className="hover:text-white transition">Личный кабинет</Link>
          <Link href="/" className="hover:text-white transition">Главная</Link>
        </div>
      </div>
    </footer>
  );
}
