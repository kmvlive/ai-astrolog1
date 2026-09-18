"use client";

import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Planet {
  key: string;
  name: string;
  glyph: string;
  is_retrograde: boolean;
  daily_motion_arcmin: number;
  period_start?: string | null;
  period_end?: string | null;
  next_start?: string | null;
  next_end?: string | null;
}

export default function RetrogradeWidget() {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/retrograde`)
      .then(r => r.json())
      .then(data => {
        setPlanets(data.planets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const retro = planets.filter(p => p.is_retrograde);
  const direct = planets.filter(p => !p.is_retrograde);

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {retro.length > 0 ? (
        <>
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/20">
            <p className="text-sm text-red-300 mb-2">
              Сейчас ретроградны {retro.length} планет{retro.length === 1 ? 'а' : retro.length < 5 ? 'ы' : ''}:
            </p>
            <div className="flex flex-wrap gap-2">
              {retro.map(p => (
                <div key={p.key} className="flex items-center gap-1 px-2 py-1 rounded bg-red-900/40 border border-red-500/30">
                  <span className="text-lg">{p.glyph}</span>
                  <span className="text-sm text-white font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {retro.slice(0, 2).map(p => (
              <div key={p.key} className="text-sm text-slate-400">
                <span className="text-white font-medium">{p.glyph} {p.name}</span> — до {p.period_end ? new Date(p.period_end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '...'}
              </div>
            ))}
            {retro.length > 2 && (
              <div className="text-sm text-slate-500">
                + ещё {retro.length - 2} планет{retro.length - 2 === 1 ? 'а' : ''}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/20">
          <p className="text-sm text-green-300">
            ✨ Все планеты движутся директно! Отличное время для новых начинаний.
          </p>
        </div>
      )}

      {direct.length > 0 && direct[0].next_start && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-1">Следующий ретроград:</p>
          <p className="text-sm text-slate-400">
            {direct[0].glyph} {direct[0].name} — {new Date(direct[0].next_start!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      )}
    </div>
  );
}
