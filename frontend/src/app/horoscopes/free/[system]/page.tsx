"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden isolate">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </main>
    );
  }

  const byYear = system.by === "year" || system.by === "year9";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/horoscopes/free" className="text-violet-400 hover:text-violet-300 text-sm">← Все гороскопы</Link>

        <div className="text-center my-8">
          <div className="text-6xl mb-4">{system.emoji}</div>
          <h1 className="text-4xl font-bold mb-3">{system.name}</h1>
          <p className="text-slate-400 max-w-xl mx-auto">{system.description}</p>
        </div>

        <div className="max-w-md mx-auto mb-10 rounded-2xl p-6 bg-slate-900 border border-white/10">
          <div className="font-semibold mb-4 text-center">🔍 Узнать свой знак</div>
          {byYear ? (
            <div className="flex gap-3">
              <input type="number" value={year} min={1920} max={2026}
                onChange={(e) => setYear(e.target.value)}
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-500"
                placeholder="Год рождения" />
              <button onClick={findSign} className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold transition">Узнать</button>
            </div>
          ) : (
            <div className="flex gap-3">
              <input type="date" value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-violet-500" />
              <button onClick={findSign} className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold transition">Узнать</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {system.signs.map((s) => (
            <Link key={s.slug} href={`/horoscopes/free/${slug}/${s.slug}`}
              className="rounded-2xl p-5 bg-slate-900 border border-white/10 hover:border-amber-400/50 hover:-translate-y-0.5 transition transform text-center">
              <div className="text-4xl mb-2">{s.emoji}</div>
              <div className="font-semibold">{s.name}</div>
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
