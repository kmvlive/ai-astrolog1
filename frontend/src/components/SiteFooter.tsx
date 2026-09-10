"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type MenuItem = {
  title: string;
  url: string;
  open_in_new_tab: boolean;
};

// Fallback меню если API не отвечает
const FALLBACK_MENU: MenuItem[] = [
  { title: "Главная", url: "/", open_in_new_tab: false },
  { title: "Гороскопы", url: "/horoscopes", open_in_new_tab: false },
  { title: "Календари", url: "/calendars", open_in_new_tab: false },
  { title: "Значение имён", url: "/names", open_in_new_tab: false },
  { title: "Сонник", url: "/dreams", open_in_new_tab: false },
  { title: "Личный кабинет", url: "/dashboard", open_in_new_tab: false },
  { title: "Условия оказания услуг", url: "/terms", open_in_new_tab: false },
];

export default function SiteFooter() {
  const [menu, setMenu] = useState<MenuItem[]>(FALLBACK_MENU);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/footer-menu`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.menu && d.menu.length > 0) {
          setMenu(d.menu);
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  return (
    <footer className="border-t border-white/10 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Меню */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-xl">🔮</span> AI Астролог © 2026
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            {menu.map((item, i) => (
              <Link
                key={i}
                href={item.url}
                target={item.open_in_new_tab ? "_blank" : undefined}
                rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                className="text-slate-500 hover:text-white transition"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Юридический текст */}
        <div className="text-xs text-slate-600 text-center space-y-2 pt-6 border-t border-white/5">
          <p>
            2014-2026 ИП Прокопенко А.В., ИНН 263211995820, свидетельство от 17.10.2007.
          </p>
          <p>
            <strong>Внимание:</strong> все права на использование материалов портала принадлежат владельцу сервиса.
            Копирование материалов, опубликованных на портале, запрещено.{" "}
            <Link href="/terms" className="underline hover:text-slate-400">
              Условия оказания услуг доступны на этой странице
            </Link>.
          </p>
          <p>
            Портал может содержать информацию и материалы, предназначенные для пользователей старше 18 лет.
          </p>
        </div>
      </div>
    </footer>
  );
}
