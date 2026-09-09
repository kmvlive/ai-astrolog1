"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Data = {
  system: { slug: string; name: string; emoji: string };
  sign: { slug: string; name: string; emoji: string };
  today: string | null;
  tomorrow: string | null;
  date: string;
};

export default function SignPage() {
  const params = useParams();
  const system = params.system as string;
  const sign = params.sign as string;
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"today" | "tomorrow">("today");

  useEffect(() => {
    fetch(`${API}/api/free-horoscopes/${system}/${sign}`)
      .then((r) => r.json())
      .then((d) => (d && !d.error ? setData(d) : null))
      .catch(() => {});
  }, [system, sign]);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  const content = tab === "today" ? data.today : data.tomorrow;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href={`/horoscopes/free/${system}`} className="text-violet-400 hover:text-violet-300 text-sm">
          ← {data.system.emoji} {data.system.name}
        </Link>

        <div className="text-center my-8">
          <div className="text-7xl mb-4">{data.sign.emoji}</div>
          <h1 className="text-4xl font-bold mb-2">{data.sign.name}</h1>
          <div className="text-slate-400">{data.system.name} · {data.date}</div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {(["today", "tomorrow"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition ${tab === t ? "bg-amber-400 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
              {t === "today" ? "Сегодня" : "Завтра"}
            </button>
          ))}
        </div>

        {content ? (
          <div className="rounded-2xl p-8 bg-slate-900 border border-white/10">
            <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-line">{content}</p>
          </div>
        ) : (
          <div className="rounded-2xl p-8 bg-slate-900 border border-white/10 text-center text-slate-400">
            Прогноз на этот день готовится — загляните чуть позже ✨
          </div>
        )}

        <div className="mt-10 rounded-2xl p-8 bg-gradient-to-r from-violet-900/40 to-amber-900/20 border border-violet-500/30 text-center">
          <h2 className="text-xl font-bold mb-2">✨ Хотите точнее?</h2>
          <p className="text-slate-300 mb-5 text-sm max-w-md mx-auto">
            Персональный гороскоп по вашей натальной карте — в разы точнее общего прогноза
          </p>
          <Link href="/pricing" className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-6 py-3 rounded-xl transition">
            Получить персональный
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link href="/horoscopes/compatibility" className="text-rose-400 hover:text-rose-300">
            💞 Проверить совместимость с другим знаком →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
