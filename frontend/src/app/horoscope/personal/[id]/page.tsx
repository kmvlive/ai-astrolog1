"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Data = { horoscope: any; date: string };

export default function PersonalHoroscopePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${API}/api/horoscope/personal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center relative overflow-hidden isolate">
        <div className="text-center">
          <div className="text-5xl mb-4">🔮</div>
          <h1 className="text-2xl font-bold mb-2">Гороскоп не найден</h1>
          <Link href="/dashboard" className="text-violet-400 hover:text-violet-300">← Вернуться в кабинет</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center relative overflow-hidden isolate">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden isolate">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 text-sm">← Кабинет</Link>

        <div className="mt-6 rounded-2xl p-8 bg-gradient-to-br from-violet-900/40 via-slate-900 to-amber-900/20 border-2 border-amber-400/30">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎁</div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-violet-400 bg-clip-text text-transparent">
              Ваш персональный прогноз
            </h1>
            <div className="text-slate-400">{data.date}</div>
          </div>

          <div className="rounded-xl p-6 bg-slate-900/60 border border-white/10">
            <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-line">
              {data.horoscope.content}
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            Прогноз составлен по вашей натальной карте (дата, время, место рождения).<br />
            Обновляется каждый день в 8:00 утра.
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-violet-400 hover:text-violet-300">
            ← Вернуться в кабинет
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
