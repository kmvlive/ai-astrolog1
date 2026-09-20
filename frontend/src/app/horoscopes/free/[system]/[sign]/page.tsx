"use client";

import CometField from "@/components/CometField";
import PersonalUpsell from "@/components/PersonalUpsell";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const ACCENTS: Record<string, string> = {
  chinese: "#f87171",
  japanese: "#fb7185",
  zoroastrian: "#fbbf24",
  druids: "#4ade80",
  flowers: "#f472b6",
  numerology: "#a78bfa",
  eastern: "#fbbf24",
  vedic: "#38bdf8",
  maya: "#f472b6",
  celtic: "#34d399",
};

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
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden isolate">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  const content = tab === "today" ? data.today : data.tomorrow;

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate aura-top" style={{ ["--accent" as any]: ACCENTS[data.system.slug] || "#a78bfa" }}>
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href={`/horoscopes/free/${system}`} className="text-violet-400 hover:text-violet-300 text-sm transition">
          ← {data.system.emoji} {data.system.name}
        </Link>

        <div className="text-center my-10">
          <div className="cal-medal mx-auto mb-5" style={{ ["--accent" as any]: ACCENTS[data.system.slug] || "#a78bfa", width: "96px", height: "96px", borderRadius: "28px" }}>
            <span className="text-6xl">{data.sign.emoji}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent mb-3">
            {data.sign.name}
          </h1>
          <div className="text-slate-500 text-sm uppercase tracking-widest">{data.system.name} · {data.date}</div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl border border-white/10 bg-slate-900/70 p-1">
            {(["today", "tomorrow"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition ${tab === t ? "bg-gradient-to-r from-amber-400 to-amber-300 text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}>
                {t === "today" ? "Сегодня" : "Завтра"}
              </button>
            ))}
          </div>
        </div>

        {content ? (
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-indigo-950/30 p-8 md:p-10 overflow-hidden">
            <span className="cal-shine" aria-hidden="true" />
            <p className="relative z-10 text-lg leading-relaxed text-slate-200 whitespace-pre-line">{content}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">
            Прогноз на этот день готовится — загляните чуть позже ✨
          </div>
        )}

        <PersonalUpsell />

        <div className="text-center mt-8">
          <Link href="/horoscopes/compatibility" className="text-rose-400 hover:text-rose-300 transition">
            💞 Проверить совместимость с другим знаком →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
