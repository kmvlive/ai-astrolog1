"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CometField from "@/components/CometField";
import MatrixDiamond from "@/components/MatrixDiamond";

const API = process.env.NEXT_PUBLIC_API_URL || "";

type Position = { name: string; value: number; arcana?: { name: string; image: string } | null };
type MatrixResult = {
  date: string;
  positions: Record<string, Position>;
  interpretation: string;
  uuid?: string;
  from_db?: boolean;
};

function bdToStr(bd: any): string {
  const d = new Date(bd);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return String(bd).slice(0, 10);
}

export default function MatrixPage() {
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<MatrixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const doCalc = useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch(`${API}/api/destiny-matrix`, {
        method: "POST",
        headers,
        body: JSON.stringify({ date: dateStr }),
      });
      const data = await r.json();
      if (data?.positions) {
        setResult(data);
        setSelected(4);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("date");
    if (d) {
      setBirthDate(d);
      doCalc(d);
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((dd) => {
        const bd = dd?.profile?.birth_date ?? dd?.birth_date;
        if (bd) setBirthDate(String(bd).slice(0, 10));
      })
      .catch(() => {});
  }, [doCalc]);

  const shareUrl =
    typeof window !== "undefined" && result?.uuid
      ? `${window.location.origin}/share/matrix/${result.uuid}`
      : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const sel = selected && result?.positions ? result.positions[String(selected)] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <CometField count={6} />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300">Главная</Link>
          {" → "}
          <Link href="/numerology" className="hover:text-slate-300">Нумерология</Link>
          {" → "}
          <span className="text-slate-300">Матрица судьбы</span>
        </div>

        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">
            Матрица судьбы
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Полная методика Наталии Ладини: 8 позиций по дате рождения. Узнайте свой путь, таланты и предназначение.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-8 mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Дата рождения</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:border-violet-500 focus:outline-none mb-4"
          />
          <button
            onClick={() => doCalc(birthDate)}
            disabled={!birthDate || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-violet-500 font-bold text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            {loading ? "⏳ Рассчитываю матрицу..." : "🔮 Рассчитать матрицу"}
          </button>
        </div>

        {result && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-indigo-950/40 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Матрица · {result.date}</h2>
                <p className="text-sm text-slate-400">Нажмите на узел, чтобы увидеть аркан позиции</p>
              </div>
              <div className="relative w-full max-w-lg mx-auto aspect-square">
                <MatrixDiamond positions={result.positions} selected={selected} onSelect={setSelected} />
              </div>
            </div>

            {sel && (
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-violet-950/40 p-8">
                <div className="flex items-start gap-6 mb-4">
                  {sel.arcana?.image && (
                    <div className="shrink-0 w-24 h-32 rounded-xl overflow-hidden border-2 border-amber-400/60 shadow-lg shadow-amber-900/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/storage/${sel.arcana.image}`}
                        alt={sel.arcana.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider text-amber-300 mb-1">Позиция {selected}</div>
                    <h3 className="text-3xl font-bold mb-2">{sel.name}</h3>
                    <div className="text-lg text-slate-300">
                      Аркан <span className="text-amber-400 font-bold">{sel.value}</span>
                      {sel.arcana && <> · <span className="text-violet-300">{sel.arcana.name}</span></>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки шаринга */}
            {result.uuid && (
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={copyLink}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition"
                >
                  {copied ? "✅ Скопировано!" : "📋 Скопировать ссылку на матрицу"}
                </button>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("🔮 Моя Матрица судьбы")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-sm font-medium transition"
                >
                  🤖 Telegram
                </a>
                <a
                  href={`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("🔮 Моя Матрица судьбы")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium transition"
                >
                  💙 VK
                </a>
              </div>
            )}

            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-8">
              <h2 className="text-2xl font-bold mb-4">🔮 Толкование матрицы</h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                {renderInterpretation(result.interpretation)}
              </div>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
