"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Cycle {
  number: number;
  started_at: string;
  ends_at: string;
  months: string[];
  days_left: number;
}

interface ReferralData {
  referral_link: string;
  referral_code: string;
  progress: number;
  target: number;
  can_start_new_cycle: boolean;
  active_cycles_count: number;
  cycles: Cycle[];
  accessible_months: string[];
  total_access_months: number;
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export default function ReferralsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/api/referrals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareLink = () => {
    if (!data) return;
    if (navigator.share) {
      navigator.share({
        title: "AI Астролог — персональные гороскопы",
        text: "Регистрируйся и получай персональные гороскопы!",
        url: data.referral_link,
      });
    } else {
      copyLink();
    }
  };

  const progressPercent = data ? Math.min(100, (data.progress / data.target) * 100) : 0;

  // Формируем таблицу месяцев (текущий + 12 вперёд)
  const allMonths: { key: string; label: string; hasAccess: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    allMonths.push({
      key,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      hasAccess: data?.accessible_months.includes(key) || false,
    });
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
      <SiteHeader />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Link href="/profile" className="text-sm text-slate-400 hover:text-violet-400 mb-4 inline-block">
          ← Назад к профилю
        </Link>
        <h1 className="text-3xl font-bold mb-2">🎁 Приведи друзей</h1>
        <p className="text-slate-400 mb-8">
          Приведи 5 друзей — получи 3 месяца бесплатного доступа к персональным гороскопам
        </p>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Загрузка...</div>
        ) : !data ? (
          <div className="text-center py-20 text-red-400">Ошибка загрузки</div>
        ) : (
          <>
            {/* === Ссылка === */}
            <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-6 mb-6">
              <div className="text-sm text-violet-300 mb-2">Ваша реферальная ссылка</div>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <input
                  type="text"
                  readOnly
                  value={data.referral_link}
                  className="flex-1 px-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white font-mono"
                />
                <button
                  onClick={copyLink}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold whitespace-nowrap transition"
                >
                  {copied ? "✓ Скопировано" : "📋 Копировать"}
                </button>
                <button
                  onClick={shareLink}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold whitespace-nowrap transition"
                >
                  📤 Поделиться
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Код: <span className="font-mono text-violet-300">{data.referral_code}</span>
              </div>
            </div>

            {/* === Прогресс === */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Приведено друзей</div>
                  <div className="text-4xl font-bold">
                    {data.progress} <span className="text-slate-500 text-2xl">/ {data.target}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Активных циклов</div>
                  <div className="text-2xl font-semibold">{data.active_cycles_count} <span className="text-slate-500 text-sm">/ 4</span></div>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {data.progress >= data.target && (
                <div className="mt-3 text-sm text-green-400">
                  ✓ Условие выполнено — цикл запущен!
                </div>
              )}
              {!data.can_start_new_cycle && data.progress === 0 && data.active_cycles_count >= 4 && (
                <div className="mt-3 text-sm text-amber-400">
                  ⏳ Достигнут максимум (4 активных цикла). Набор откроется, когда закончится самый старый цикл.
                </div>
              )}
            </div>

            {/* === Активные циклы === */}
            {data.cycles.length > 0 && (
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">🔥 Активные циклы</h2>
                <div className="space-y-3">
                  {data.cycles.map((cycle) => (
                    <div key={cycle.number} className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">Цикл #{cycle.number}</div>
                          <div className="text-sm text-slate-400">
                            {new Date(cycle.started_at).toLocaleDateString("ru-RU")} →{" "}
                            {new Date(cycle.ends_at).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-violet-400">
                            {cycle.days_left}
                          </div>
                          <div className="text-xs text-slate-400">дней осталось</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {cycle.months.map((m) => (
                          <span key={m} className="px-2.5 py-1 bg-violet-600/30 border border-violet-500/30 rounded-md text-xs font-medium">
                            {MONTH_NAMES[parseInt(m.split("-")[1]) - 1]} {m.split("-")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === Таблица месяцев === */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">📅 Доступ к персональным гороскопам</h2>
              <div className="text-sm text-slate-400 mb-4">
                Всего месяцев с доступом: <span className="text-white font-semibold">{data.total_access_months}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allMonths.map((m) => (
                  <div
                    key={m.key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                      m.hasAccess
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-slate-800/30 border-white/5"
                    }`}
                  >
                    <span className={m.hasAccess ? "text-white" : "text-slate-500"}>
                      {m.label}
                    </span>
                    {m.hasAccess ? (
                      <span className="text-green-400 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* === Как это работает === */}
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">💡 Как это работает</h2>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Поделитесь ссылкой с друзьями</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Когда зарегистрируются 5 друзей — автоматически откроется доступ на 3 месяца</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Можете сразу набирать следующих 5 — до 4 циклов (12 месяцев) одновременно</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Персональные гороскопы будут приходить бесплатно все открытые месяцы</span>
                </li>
              </ol>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
