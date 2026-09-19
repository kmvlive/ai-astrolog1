"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type RuneOfDayData = {
  date: string;
  rune: {
    slug: string;
    image: string;
    name: string;
    glyph: string;
    element: string;
    meaning: string;
    advice: string;
  };
};

export default function RuneOfDay() {
  const [data, setData] = useState<RuneOfDayData | null>(null);

  useEffect(() => {
    fetch(`${API}/api/runes/today`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-indigo-950/40 p-6 overflow-hidden mb-10">
      <span className="cal-shine" aria-hidden="true" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
        {/* Картинка руны в музейной раме */}
        <div className="relative shrink-0">
          <div className="absolute -inset-4 rounded-[8px] bg-violet-700/15 blur-2xl opacity-80"></div>
          <div className="relative rounded-[6px] p-[3px] bg-gradient-to-br from-amber-200 via-amber-600 to-amber-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
            <div className="rounded-[4px] bg-[#1a1430] p-[6px] sm:p-[8px]">
              <div className="rounded-[3px] p-[1.5px] bg-gradient-to-br from-amber-300/80 via-amber-500/60 to-amber-800/80">
                <div className="relative aspect-[7/10] w-36 sm:w-44 overflow-hidden rounded-[2px] bg-[#0a0715]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/storage/${data.rune.image}`}
                    alt={`Руна дня ${data.rune.name}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_55px_rgba(8,5,26,0.65)]"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Описание */}
        <div className="flex-1 text-center sm:text-left">
          <div className="text-xs uppercase tracking-[0.3em] text-violet-300 mb-2">
            🪨 Руна дня · {data.date}
          </div>
          <div className="flex items-baseline gap-3 justify-center sm:justify-start mb-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{data.rune.name}</h2>
            <span className="text-3xl bg-gradient-to-br from-amber-200 to-amber-500 bg-clip-text text-transparent">
              {data.rune.glyph}
            </span>
          </div>
          <p className="text-white/90 leading-relaxed mb-2">{data.rune.meaning}</p>
          <p className="text-violet-200 italic text-sm mb-4">💡 {data.rune.advice}</p>
          <Link
            href="/runes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-medium transition"
          >
            ᚱ Все 24 руны и руна дня →
          </Link>
        </div>
      </div>
    </div>
  );
}
