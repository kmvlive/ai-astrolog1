"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CometField from "@/components/CometField";

const API = process.env.NEXT_PUBLIC_API_URL || "";

type Matrix = {
  uuid: string;
  birth_date: string;
  positions: Record<string, { name: string; value: number; arcana?: { name: string } }>;
  created_at: string;
};

export default function MyMatricesPage() {
  const [matrices, setMatrices] = useState<Matrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchMatrices = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const r = await fetch(`${API}/api/destiny-matrix/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setMatrices(data.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrices();
  }, []);

  const deleteMatrix = async (uuid: string) => {
    if (!confirm("Удалить эту матрицу?")) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    await fetch(`${API}/api/destiny-matrix/${uuid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setMatrices(matrices.filter((m) => m.uuid !== uuid));
  };

  const copyShareLink = async (uuid: string) => {
    const url = `${window.location.origin}/share/matrix/${uuid}`;
    await navigator.clipboard.writeText(url);
    setCopied(uuid);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen text-white relative overflow-hidden isolate">
        <SiteHeader />
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-4" />
          <div>Загрузка...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden isolate">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
              Мои матрицы
            </h1>
            <p className="text-slate-400">История расчётов Матрицы судьбы</p>
          </div>
          <Link
            href="/numerology/matrix"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-violet-500 font-semibold hover:opacity-90 transition"
          >
            🔮 Новая матрица
          </Link>
        </div>

        {matrices.length === 0 ? (
          <div className="rounded-2xl p-8 bg-slate-900 border border-white/10 text-center">
            <div className="text-5xl mb-4">🔮</div>
            <div className="text-xl font-semibold mb-2">У вас пока нет матриц</div>
            <div className="text-slate-400 mb-6">Рассчитайте свою Матрицу судьбы по дате рождения</div>
            <Link
              href="/numerology/matrix"
              className="inline-block bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-semibold transition"
            >
              Рассчитать матрицу
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matrices.map((m) => (
              <div
                key={m.uuid}
                className="rounded-2xl p-6 bg-slate-900 border border-white/10 hover:border-violet-500/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">
                      Дата рождения: <span className="text-white font-semibold">{m.birth_date}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Рассчитано: {new Date(m.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <Link
                    href={`/numerology/matrix?date=${m.birth_date}`}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition"
                  >
                    Открыть
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {["1", "2", "4"].map((num) => {
                    const pos = m.positions[num];
                    if (!pos) return null;
                    return (
                      <div key={num} className="rounded-lg bg-slate-800/50 p-3 border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">{pos.name}</div>
                        <div className="text-amber-400 font-bold text-lg mb-0.5">{pos.value}</div>
                        <div className="text-sm text-violet-300">{pos.arcana?.name || "—"}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyShareLink(m.uuid)}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition"
                  >
                    {copied === m.uuid ? "✅ Скопировано!" : "📋 Поделиться"}
                  </button>
                  <button
                    onClick={() => deleteMatrix(m.uuid)}
                    className="px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm font-medium transition"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
