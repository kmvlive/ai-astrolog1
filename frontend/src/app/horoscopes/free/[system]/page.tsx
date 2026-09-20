"use client";

import CometField from "@/components/CometField";
import PersonalUpsell from "@/components/PersonalUpsell";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

const SIGN_ACCENTS = ["#f87171", "#fbbf24", "#4ade80", "#a78bfa", "#38bdf8", "#f472b6", "#fb7185", "#34d399", "#f59e0b", "#818cf8", "#22d3ee", "#e879f9"];

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type System = {
  slug: string; name: string; emoji: string; by: string; description: string;
  signs: { slug: string; name: string; emoji: string }[];
};

export default function SystemPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.system as string;
  const [system, setSystem] = useState<System | null>(null);
  const [year, setYear] = useState("1990");
  const [date, setDate] = useState("1990-06-15");

  useEffect(() => {
    fetch(`${API}/api/free-horoscopes/systems`)
      .then((r) => r.json())
      .then((d) => {
        const s = (d.systems || []).find((x: System) => x.slug === slug);
        setSystem(s || null);
      })
      .catch(() => {});
  }, [slug]);

  const findSign = async () => {
    const q = system?.by === "year" || system?.by === "year9"
      ? `year=${year}`
      : (() => { const p = date.split("-"); return `month=${+p[1]}&day=${+p[2]}`; })();
    const r = await fetch(`${API}/api/free-horoscopes/${slug}/my-sign?${q}`);
    const d = await r.json();
    if (d.sign) router.push(`/horoscopes/free/${slug}/${d.sign}`);
  };

  if (!system) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center relative overflow-hidden isolate">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  const byYear = system.by === "year" || system.by === "year9";

  return (
    <main className="min-h-screen text-white relative overflow-hidden isolate aura-top" style={{ ["--accent" as any]: ACCENTS[slug] || "#a78bfa" }}>
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/horoscopes/free" className="text-violet-400 hover:text-violet-300 text-sm transition">← Все бесплатные гороскопы</Link>

        <div className="text-center my-10">
          <div className="cal-medal mx-auto mb-5" style={{ ["--accent" as any]: ACCENTS[slug] || "#a78bfa", width: "88px", height: "88px", borderRadius: "24px" }}>
            <span className="text-5xl">{system.emoji}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent mb-4">
            {system.name}
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">{system.description}</p>
        </div>

        <div className="max-w-md mx-auto mb-12 relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 p-6 overflow-hidden">
          <span className="cal-shine" aria-hidden="true" />
          <div className="relative z-10">
            <div className="font-semibold mb-4 text-center text-white">🔍 Узнать свой знак</div>
            {byYear ? (
              <div className="flex gap-3">
                <input type="number" value={year} min={1920} max={2026}
                  onChange={(e) => setYear(e.target.value)}
                  className="flex-1 bg-slate-800/70 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-500 transition"
                  placeholder="Год рождения" />
                <button onClick={findSign} className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold transition shadow-lg shadow-violet-600/30">Узнать</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input type="date" value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-slate-800/70 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-500 transition" />
                <button onClick={findSign} className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold transition shadow-lg shadow-violet-600/30">Узнать</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {system.signs.map((s, i) => (
            <Link key={s.slug} href={`/horoscopes/free/${slug}/${s.slug}`}
              style={{ ["--accent" as any]: SIGN_ACCENTS[i % SIGN_ACCENTS.length] }}
              className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden hover:border-white/20 hover:-translate-y-1 transition text-center">
              <span className="cal-shine" aria-hidden="true" />
              <div className="relative z-10">
                <div className="cal-medal mx-auto mb-3" style={{ width: "64px", height: "64px", borderRadius: "18px" }}>
                  <span className="text-3xl group-hover:scale-110 transition-transform inline-block">{s.emoji}</span>
                </div>
                <div className="font-semibold text-white group-hover:text-amber-200 transition">{s.name}</div>
              </div>
            </Link>
          ))}
        </div>

        <PersonalUpsell />
      </div>
      <SiteFooter />
    </main>
  );
}
