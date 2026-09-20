"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";


const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Plan = {
  id: number;
  slug: string;
  name: string;
  price: number;
  price_rub: number;
  formatted_price: string;
  original_price: number | null;
  formatted_original_price: string | null;
  duration_days: number;
  features: string[];
  popular: boolean;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);
  const [currentSub, setCurrentSub] = useState<{ plan_type: string; expires_at: string; status: string } | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    // Подгружаем текущую подписку
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          console.log("/me response:", d);
          const s = d?.subscription;
          if (s && s.status === "active" && new Date(s.expires_at).getTime() > Date.now()) {
            setCurrentSub(s);
          }
        })
        .catch(() => {});
    }

    fetch(`${API}/api/plans`)
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const pay = async (plan: Plan) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setPaying(plan.id);
    try {
      const r = await fetch(`${API}/api/payments/init`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: plan.id, auto_renew: autoRenew }),
      });
      const data = await r.json();
      if (data.success && data.payment_url) {
        localStorage.setItem("pending_payment_id", String(data.payment_id));
        window.location.href = data.payment_url;
      } else {
        if (data.code === "ALREADY_ACTIVE") {
          alert(data.message);
        } else {
          alert(data.message || "Ошибка создания платежа");
        }
      }
    } catch (e) {
      alert("Ошибка сети");
    } finally {
      setPaying(null);
    }
  };

  const daysLeft = currentSub ? Math.max(0, Math.ceil((new Date(currentSub.expires_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <main className="min-h-screen text-white relative overflow-hidden isolate">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <div className="pricing-eyebrow">💎 Тарифы подписки</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            Персональный гороскоп
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Выберите план и получите прогноз, составленный специально для вас — на основе даты, времени и места рождения
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-4" />
            <div>Загружаем тарифы...</div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            Тарифы временно недоступны. Попробуйте позже.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                style={{ ["--accent" as any]: plan.popular ? "#fbbf24" : ["#38bdf8", "#a855f7", "#ec4899"][i % 3] }}
                className={`plan-card relative rounded-3xl p-8 overflow-hidden flex flex-col ${plan.popular ? "plan-popular" : ""}`}
              >
                <span className="plan-watermark" aria-hidden="true">
                  {plan.duration_days <= 7 ? "🌙" : plan.duration_days <= 30 ? "💎" : "👑"}
                </span>
                <span className="cal-shine" aria-hidden="true" />
                {plan.popular && <div className="plan-badge">⭐ ПОПУЛЯРНЫЙ</div>}

                <div className="cal-medal mb-4" style={{ width: "60px", height: "60px", borderRadius: "18px" }}>
                  <span className="text-3xl">{plan.duration_days <= 7 ? "🌙" : plan.duration_days <= 30 ? "💎" : "👑"}</span>
                </div>
                <h3 className="relative z-10 text-2xl font-bold mb-1 text-white">{plan.name}</h3>
                <div className="relative z-10 mb-1 text-sm text-slate-400">{plan.duration_days} дней</div>

                <div className="my-6 relative z-10">
                  {plan.original_price && plan.original_price > plan.price && (
                    <div className="text-lg text-slate-500 line-through mb-1">
                      {plan.formatted_original_price}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="plan-price">{plan.formatted_price}</span>
                    {plan.original_price && plan.original_price > plan.price && (
                      <span className="plan-discount">
                        -{Math.round((1 - plan.price / plan.original_price) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 min-h-[180px] relative z-10 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="plan-check">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!currentSub || currentSub.plan_type !== plan.slug ? (
                  <label className="plan-autorenew relative z-10 flex items-start gap-3 mb-4 p-3 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-5 h-5 rounded accent-violet-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">💳 Автопродление</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Карта будет списываться автоматически. Отменить можно в кабинете в любой момент.
                      </div>
                    </div>
                  </label>
                ) : null}

                {currentSub && currentSub.plan_type === plan.slug ? (
                  <div className="text-center">
                    <div className="plan-active relative z-10 rounded-xl py-3 px-4 text-sm font-semibold">
                      ✓ Активен до {new Date(currentSub.expires_at).toLocaleDateString("ru-RU")}
                      <div className="text-xs font-normal mt-1 opacity-80">
                        {daysLeft > 0 ? `Осталось ${daysLeft} дн.` : "Истекает сегодня"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => pay(plan)}
                    disabled={paying === plan.id}
                    className={`plan-btn relative z-10 w-full py-3.5 rounded-xl font-bold transition disabled:opacity-50 ${
                      plan.popular ? "plan-btn-gold" : ""
                    }`}
                  >
                    {paying === plan.id ? "Переход к оплате..." : currentSub ? "Сменить тариф" : "Выбрать план"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Гарантии */}
        <div className="mt-16 grid sm:grid-cols-3 gap-5 text-center max-w-4xl mx-auto">
          {[
            { emoji: "🔒", accent: "#34d399", title: "Безопасная оплата", desc: "Через Т-Банк" },
            { emoji: "💫", accent: "#a855f7", title: "AI-прогнозы", desc: "Составлены лично для вас" },
            { emoji: "📬", accent: "#38bdf8", title: "Ваш канал", desc: "Email, Telegram или др." },
          ].map((g) => (
            <div
              key={g.title}
              style={{ ["--accent" as any]: g.accent }}
              className="cal-card relative rounded-3xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 p-6 overflow-hidden"
            >
              <span className="cal-shine" aria-hidden="true" />
              <div className="cal-medal mb-3 mx-auto" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
                <span className="text-2xl">{g.emoji}</span>
              </div>
              <div className="relative z-10 font-semibold mb-1 text-white">{g.title}</div>
              <div className="relative z-10 text-sm text-slate-400">{g.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/login" className="login-pill">
            Уже есть подписка? Войти в кабинет →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
