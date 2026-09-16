"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Affirmation {
  id: number;
  date: string;
  title: string;
  description: string;
}

export default function AffirmationsPage() {
  const router = useRouter();
  const [today, setToday] = useState<Affirmation | null>(null);
  const [calendar, setCalendar] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setIsLoggedIn(!!token);

    const requests: Promise<any>[] = [
      fetch(`${API_URL}/api/affirmations/today`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/affirmations/calendar?days=30`).then(r => r.ok ? r.json() : []),
    ];
    if (token) {
      requests.push(
        fetch(`${API_URL}/api/affirmations/subscription-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : { subscribed: false })
      );
    } else {
      requests.push(Promise.resolve({ subscribed: false }));
    }

    Promise.all(requests)
      .then(([todayData, calendarData, statusData]) => {
        setToday(todayData);
        setCalendar(calendarData || []);
        setSubscribed(statusData?.subscribed || false);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setSubLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/affirmations/subscribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setSubscribed(true);
    } catch {}
    finally { setSubLoading(false); }
  };

  const shareAffirmation = async () => {
    if (!today) return;
    const url = `${window.location.origin}/affirmations/${today.date.split('T')[0]}`;
    const text = `${today.title}\n\n${today.description}\n\n💫 ${url}`;
    if (navigator.share) {
      navigator.share({ title: today.title, text, url });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-4xl font-bold mb-2">💫 Здоровье и настрой</h1>
        <p className="text-slate-400 mb-8">Ежедневные аффирмации для гармонии и вдохновения</p>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Загрузка...</div>
        ) : (
          <>
            {/* Сегодняшняя аффирмация */}
            {today && (
              <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-8 mb-8">
                <div className="text-sm text-violet-300 mb-2">Сегодня, {formatDate(today.date)}</div>
                <h2 className="text-3xl font-bold mb-4">{today.title}</h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-6">{today.description}</p>
                <button
                  onClick={shareAffirmation}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition"
                >
                  {copied ? "✓ Скопировано" : "📤 Поделиться"}
                </button>
              </div>
            )}

            {/* Подписка — умная форма */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-3">📬 Получать аффирмацию каждое утро в 8:00</h3>
              {subscribed ? (
                <div className="flex items-center gap-3 text-green-400">
                  <span className="text-2xl">✓</span>
                  <span>Вы подписаны! Аффирмация будет приходить на вашу почту каждое утро.</span>
                </div>
              ) : isLoggedIn ? (
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {subLoading ? "Подписка..." : "🔔 Подписаться на аффирмации"}
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push("/login")}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition"
                  >
                    Войти, чтобы подписаться
                  </button>
                  <span className="text-sm text-slate-400">Подписка доступна авторизованным пользователям</span>
                </div>
              )}
            </div>

            {/* Календарь */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">📅 Календарь аффирмаций</h3>
              {calendar.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calendar.map((aff) => (
                    <div
                      key={aff.id}
                      className={`p-4 rounded-xl border transition ${
                        isToday(aff.date)
                          ? "bg-violet-600/20 border-violet-500/50"
                          : "bg-slate-800/30 border-white/5"
                      }`}
                    >
                      <div className="text-sm text-slate-400 mb-1">{formatDate(aff.date)}</div>
                      <div className="font-semibold text-white mb-1">{aff.title}</div>
                      <div className="text-sm text-slate-400 line-clamp-2">{aff.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Аффирмации генерируются ежедневно. Завтра появится новая!
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
