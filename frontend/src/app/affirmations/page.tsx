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
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
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
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
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
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-10">
          <div className="pricing-eyebrow mb-4">💫 ЗДОРОВЬЕ И НАСТРОЙ</div>
          <div className="cal-medal mx-auto mb-5" style={{ width: "84px", height: "84px", borderRadius: "26px", ["--accent" as any]: "#e879f9" }}>
            <span className="text-4xl">💫</span>
          </div>
          <h1 className="sr-only">Здоровье и настрой — ежедневные аффирмации</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Ежедневные аффирмации для гармонии и вдохновения</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Загрузка...</div>
        ) : (
          <>
            {/* Сегодняшняя аффирмация */}
            {today && (
              <div style={{ ["--accent" as any]: "#e879f9" }} className="home-panel relative p-8 md:p-10 mb-8">
                <span className="cal-shine" aria-hidden="true" />
                <span className="cal-watermark" aria-hidden="true">💫</span>
                <div className="relative z-10">
                  <div className="text-sm text-fuchsia-300 mb-2">Сегодня, {formatDate(today.date)}</div>
                  <h2 className="text-3xl font-bold mb-4 text-white">{today.title}</h2>
                  <div className="quote-card mb-6">
                    <p className="text-lg text-white leading-relaxed italic">{today.description}</p>
                  </div>
                  <button
                    onClick={shareAffirmation}
                    className="plan-btn px-6 py-3 rounded-xl font-bold"
                  >
                    {copied ? "✓ Скопировано" : "📤 Поделиться"}
                  </button>
                </div>
              </div>
            )}

            {/* Подписка — умная форма */}
            <div style={{ ["--accent" as any]: "#38bdf8" }} className="home-panel p-6 mb-8">
              <h3 className="relative z-10 text-xl font-bold mb-3 text-white">📬 Получать аффирмацию каждое утро в 8:00</h3>
              {subscribed ? (
                <div className="relative z-10 flex items-center gap-3">
                  <span className="dash-status-connected shrink-0">✓ Подписан</span>
                  <span className="text-slate-300 text-sm">Аффирмация приходит на почту каждое утро</span>
                </div>
              ) : isLoggedIn ? (
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="plan-btn px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {subLoading ? "Подписка..." : "🔔 Подписаться на аффирмации"}
                </button>
              ) : (
                <div className="relative z-10 flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => router.push("/login")}
                    className="plan-btn px-6 py-3 rounded-xl font-bold"
                  >
                    Войти, чтобы подписаться
                  </button>
                  <span className="text-sm text-slate-400">Подписка доступна авторизованным пользователям</span>
                </div>
              )}
            </div>

            {/* Календарь */}
            <div style={{ ["--accent" as any]: "#e879f9" }} className="home-panel p-6">
              <h3 className="relative z-10 text-xl font-bold mb-4 text-white">📅 Календарь аффирмаций</h3>
              {calendar.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calendar.map((aff) => (
                    <div
                      key={aff.id}
                      style={{ ["--accent" as any]: isToday(aff.date) ? "#fbbf24" : "#e879f9" }}
                      className={`cal-card relative rounded-2xl p-4 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden ${isToday(aff.date) ? "plan-popular" : ""}`}
                    >
                      <span className="cal-shine" aria-hidden="true" />
                      {isToday(aff.date) && <div className="plan-badge" style={{ top: "10px", left: "auto", right: "10px", transform: "none" }}>⭐ Сегодня</div>}
                      <div className="relative z-10">
                        <div className="text-sm text-fuchsia-300 mb-1">{formatDate(aff.date)}</div>
                        <div className="font-semibold text-white mb-1">{aff.title}</div>
                        <div className="text-sm text-slate-400 line-clamp-2">{aff.description}</div>
                      </div>
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
