"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WIKI_RAW from "@/data/wiki-days.json";
import { isSaintName } from "@/lib/saint-names";

type WikiDay = { names?: string[] };
const WIKI = WIKI_RAW as Record<string, WikiDay>;
const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

export default function NameSearch() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<{ date: string; label: string }[] | null>(null);
  const router = useRouter();

  const search = () => {
    const query = name.trim();
    if (query.length < 2) return;
    
    const dates: { date: string; label: string }[] = [];
    for (const [key, val] of Object.entries(WIKI)) {
      if (!val.names) continue;
      const hit = val.names.filter(isSaintName).find((n) => n.toLowerCase().startsWith(query.toLowerCase()));
      if (hit) {
        const [m, d] = key.split("-").map(Number);
        dates.push({
          date: `2026-${key}`,
          label: `${d} ${MONTHS[m - 1]} — ${hit}`,
        });
      }
    }
    setResult(dates);
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-900/30 to-cyan-900/20 border border-sky-500/20 mb-8">
      <h3 className="text-xl font-bold mb-3">🔍 Найти именины по имени</h3>
      <p className="text-slate-400 text-sm mb-4">Введите имя — покажем все даты именин в течение года</p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Например: Александр, Анна, Дмитрий..."
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/60"
        />
        <button onClick={search} className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold transition">
          Найти
        </button>
      </div>
      {result !== null && (
        <div className="mt-4">
          {result.length === 0 ? (
            <p className="text-slate-400">Не нашли именинников с таким именем. Попробуйте другое написание или уменьшительную форму.</p>
          ) : (
            <>
              <p className="text-sky-200 mb-3">Именины для «{name}»: {result.length} {result.length === 1 ? "дата" : result.length < 5 ? "даты" : "дат"}</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {result.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => router.push(`/calendars/names/${d.date}`)}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-sky-500/40 text-left transition"
                  >
                    <div className="text-sm text-sky-300">{d.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
