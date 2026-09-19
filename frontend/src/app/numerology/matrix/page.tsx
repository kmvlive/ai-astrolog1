"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CometField from "@/components/CometField";

const API = process.env.NEXT_PUBLIC_API_URL || "";

const ARCANA = [
  { n: 1, name: "Маг", slug: "mag" },
  { n: 2, name: "Жрица", slug: "zhrica" },
  { n: 3, name: "Императрица", slug: "imperatorica" },
  { n: 4, name: "Император", slug: "imperator" },
  { n: 5, name: "Иерофант", slug: "ierofant" },
  { n: 6, name: "Влюблённые", slug: "vlyublennye" },
  { n: 7, name: "Колесница", slug: "kolesnica" },
  { n: 8, name: "Сила", slug: "sila" },
  { n: 9, name: "Отшельник", slug: "otshelnik" },
  { n: 10, name: "Колесо Фортуны", slug: "koleso-fortuny" },
  { n: 11, name: "Справедливость", slug: "spravedlivost" },
  { n: 12, name: "Повешенный", slug: "poveshenny" },
  { n: 13, name: "Смерть", slug: "smert" },
  { n: 14, name: "Умеренность", slug: "umerennost" },
  { n: 15, name: "Дьявол", slug: "dyavol" },
  { n: 16, name: "Башня", slug: "bashnya" },
  { n: 17, name: "Звезда", slug: "zvezda" },
  { n: 18, name: "Луна", slug: "luna" },
  { n: 19, name: "Солнце", slug: "solnce" },
  { n: 20, name: "Суд", slug: "sud" },
  { n: 21, name: "Мир", slug: "mir" },
  { n: 22, name: "Шут", slug: "shut" },
];

type Position = { name: string; value: number };
type MatrixResult = {
  date: string;
  positions: Record<string, Position>;
  interpretation: string;
};

export default function MatrixPage() {
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<MatrixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const bd = d?.profile?.birth_date ?? d?.birth_date;
        if (bd) setBirthDate(String(bd).slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const handleCalc = async () => {
    if (!birthDate) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/destiny-matrix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: birthDate }),
      });
      const data = await r.json();
      setResult(data);
      setSelected(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getArcana = (n: number) => ARCANA.find((a) => a.n === n);

  const renderInterpretation = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-bold text-amber-300">{part}</strong> : <span key={i}>{part}</span>
    );
  };

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

        {/* Форма */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-8 mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Дата рождения</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:border-violet-500 focus:outline-none mb-4"
          />
          <button
            onClick={handleCalc}
            disabled={!birthDate || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-violet-500 font-bold text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            {loading ? "⏳ Рассчитываю матрицу..." : "🔮 Рассчитать матрицу"}
          </button>
        </div>

        {/* Результат */}
        {result && (
          <div className="space-y-8">
            {/* Визуализация матрицы */}
            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 to-indigo-950/40 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Матрица · {result.date}</h2>
                <p className="text-sm text-slate-400">Нажмите на аркан, чтобы увидеть подробности</p>
              </div>

              <div className="relative w-full max-w-lg mx-auto aspect-square">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Ромб */}
                  <polygon points="200,50 350,200 200,350 50,200" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="2" />
                  <line x1="200" y1="50" x2="200" y2="350" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
                  <line x1="50" y1="200" x2="350" y2="200" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />

                  {/* Позиции */}
                  {Object.entries(result.positions).map(([num, pos]) => {
                    const coords = {
                      1: { x: 200, y: 50 },   // Верх (Личность)
                      2: { x: 350, y: 200 },   // Право (Таланты)
                      3: { x: 200, y: 350 },   // Низ (Предназначение)
                      4: { x: 200, y: 200 },   // Центр
                      5: { x: 50, y: 200 },    // Лево (Карма)
                      6: { x: 125, y: 125 },   // Верх-лево (Деньги)
                      7: { x: 275, y: 125 },   // Верх-право (Любовь)
                      8: { x: 200, y: 275 },   // Итог (между центром и низом)
                    }[num as unknown as keyof typeof coords];

                    if (!coords) return null;

                    const isSelected = selected === Number(num);
                    const arcana = getArcana(pos.value);

                    return (
                      <g key={num} onClick={() => setSelected(Number(num))} className="cursor-pointer">
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={isSelected ? 32 : 28}
                          fill={isSelected ? "rgba(251,191,36,0.2)" : "rgba(139,92,246,0.15)"}
                          stroke={isSelected ? "#fbbf24" : "rgba(139,92,246,0.5)"}
                          strokeWidth={isSelected ? 3 : 2}
                        />
                        <text x={coords.x} y={coords.y - 5} textAnchor="middle" fill="#fbbf24" fontSize="20" fontWeight="bold">
                          {pos.value}
                        </text>
                        <text x={coords.x} y={coords.y + 15} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">
                          {pos.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Детали выбранной позиции */}
            {selected && result.positions[selected] && (
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-violet-950/40 p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/storage/tarot/${getArcana(result.positions[selected].value)?.slug}.png`}
                      alt={getArcana(result.positions[selected].value)?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider text-amber-300 mb-1">
                      Позиция {selected}
                    </div>
                    <h3 className="text-3xl font-bold mb-2">
                      {result.positions[selected].name}
                    </h3>
                    <div className="text-lg text-slate-300">
                      Аркан <span className="text-amber-400 font-bold">{result.positions[selected].value}</span> ·{" "}
                      <span className="text-violet-300">{getArcana(result.positions[selected].value)?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-400 italic">
                  Эта позиция описывает {result.positions[selected].name.toLowerCase()} в вашей матрице судьбы.
                </div>
              </div>
            )}

            {/* AI-толкование всей матрицы */}
            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-8">
              <h2 className="text-2xl font-bold mb-4">🔮 Толкование матрицы</h2>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-line">
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
