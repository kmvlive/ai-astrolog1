"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CometField from "@/components/CometField";
import MatrixDiamond from "@/components/MatrixDiamond";

const API = process.env.NEXT_PUBLIC_API_URL || "";

type Position = { name: string; value: number; arcana?: { name: string; image: string } | null };

export default function ShareMatrixPage() {
  const params = useParams();
  const uuid = String(params.uuid || "");
  const [data, setData] = useState<{
    date: string;
    positions: Record<string, Position>;
    interpretation: string;
  } | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<number | null>(4);

  useEffect(() => {
    if (!uuid) return;
    fetch(`${API}/api/destiny-matrix/share/${uuid}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [uuid]);

  const renderInterpretation = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-bold text-amber-300">{part}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const sel = selected && data?.positions ? data.positions[String(selected)] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">️</div>
            <p className="text-slate-400">Матрица не найдена или ссылка устарела</p>
            <Link href="/numerology/matrix" className="inline-block mt-6 text-violet-300 hover:text-violet-200">
              Рассчитать свою матрицу →
            </Link>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-5xl mb-3">🔮</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">
                Матрица судьбы
              </h1>
              <p className="text-slate-400">Дата рождения: {data.date}</p>
            </div>

            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-indigo-950/40 p-8">
              <div className="relative w-full max-w-lg mx-auto aspect-square">
                <MatrixDiamond positions={data.positions} selected={selected} onSelect={setSelected} />
              </div>
            </div>

            {sel && (
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-violet-950/40 p-6 flex items-center gap-5">
                {sel.arcana?.image && (
                  <div className="shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 border-amber-400/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/storage/${sel.arcana.image}`} alt={sel.arcana.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-300 mb-1">Позиция {selected}</div>
                  <div className="text-2xl font-bold mb-1">{sel.name}</div>
                  <div className="text-slate-300">
                    Аркан <span className="text-amber-400 font-bold">{sel.value}</span>
                    {sel.arcana && <> · <span className="text-violet-300">{sel.arcana.name}</span></>}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-8">
              <h2 className="text-xl font-bold mb-4">🔮 Толкование матрицы</h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                {renderInterpretation(data.interpretation)}
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/numerology/matrix"
                className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-violet-500 font-bold text-white hover:opacity-90 transition"
              >
                🔮 Рассчитать свою матрицу
              </Link>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
