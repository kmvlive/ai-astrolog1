"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DivinationPage from "../_components/DivinationPage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function RunesPage() {
  const [runeOfTheDay, setRuneOfTheDay] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/runes/today`)
      .then((r) => r.json())
      .then((d) => setRuneOfTheDay(d))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Руна дня — карточка сверху */}
      {runeOfTheDay && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8">
          <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-indigo-950/40 p-6 overflow-hidden">
            <span className="cal-shine" aria-hidden="true" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
              {/* Картинка руны */}
              <div className="relative shrink-0">
                <div className="absolute -inset-4 rounded-[8px] bg-violet-700/15 blur-2xl opacity-80"></div>
                <div className="relative rounded-[6px] p-[3px] bg-gradient-to-br from-amber-200 via-amber-600 to-amber-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
                  <div className="rounded-[4px] bg-[#1a1430] p-[6px] sm:p-[8px]">
                    <div className="rounded-[3px] p-[1.5px] bg-gradient-to-br from-amber-300/80 via-amber-500/60 to-amber-800/80">
                      <div className="relative aspect-[7/10] w-36 sm:w-44 overflow-hidden rounded-[2px] bg-[#0a0715]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/storage/${runeOfTheDay.rune.image}`}
                          alt={runeOfTheDay.rune.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_55px_rgba(8,5,26,0.65)]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Описание руны дня */}
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs uppercase tracking-[0.3em] text-violet-300 mb-2">
                  🪨 Руна дня · {runeOfTheDay.date}
                </div>
                <div className="flex items-baseline gap-3 justify-center sm:justify-start mb-3">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">
                    {runeOfTheDay.rune.name}
                  </h2>
                  <span className="text-2xl bg-gradient-to-br from-amber-200 to-amber-500 bg-clip-text text-transparent">
                    {runeOfTheDay.rune.glyph}
                  </span>
                </div>
                <p className="text-white/90 leading-relaxed mb-2">
                  {runeOfTheDay.rune.meaning}
                </p>
                <p className="text-violet-200 italic text-sm">
                  💡 {runeOfTheDay.rune.advice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DivinationPage
        type="runes"
        title="На рунах"
        emoji="ᚱ"
        description="Три руны Старшего Футарка — мудрость скандинавских предков"
        gradient="from-sky-400 via-blue-400 to-indigo-400"
        placeholder="Задайте вопрос рунам..."
      />
    </>
  );
}
