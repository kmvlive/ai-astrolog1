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
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
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
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition transform hover:-translate-y-1 ${
                  plan.popular
                    ? "bg-gradient-to-br from-violet-900/50 to-slate-900 border-2 border-amber-400 shadow-2xl shadow-amber-500/10"
                    : "bg-slate-900 border border-white/10 hover:border-violet-500/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">
                    ПОПУЛЯРНЫЙ
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-1 text-sm text-slate-400">
                  {plan.duration_days} {plan.duration_days === 7 ? "дней" : plan.duration_days === 30 ? "дней" : "дней"}
                </div>

                <div className="my-6">
                  {plan.original_price && plan.original_price > plan.price && (
                    <div className="text-lg text-slate-500 line-through mb-1">
                      {plan.formatted_original_price}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.formatted_price}</span>
                    {plan.original_price && plan.original_price > plan.price && (
                      <span className="text-sm font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        -{Math.round((1 - plan.price / plan.original_price) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 min-h-[180px]">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-violet-400 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!currentSub || currentSub.plan_type !== plan.slug ? (
                  <label className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-violet-900/20 border border-violet-500/30 cursor-pointer hover:bg-violet-900/30 transition">
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
                    <div className="bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl py-3 px-4 text-sm font-semibold">
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
                    className={`w-full py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
                      plan.popular
                        ? "bg-amber-400 hover:bg-amber-300 text-slate-900"
                        : "bg-violet-600 hover:bg-violet-500 text-white"
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
        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <div className="font-semibold mb-1">Безопасная оплата</div>
            <div className="text-sm text-slate-400">Через Т-Банк</div>
          </div>
          <div>
            <div className="text-3xl mb-2">💫</div>
            <div className="font-semibold mb-1">AI-прогнозы</div>
            <div className="text-sm text-slate-400">Составлены лично для вас</div>
          </div>
          <div>
            <div className="text-3xl mb-2">📬</div>
            <div className="font-semibold mb-1">Ваш канал</div>
            <div className="text-sm text-slate-400">Email, Telegram или др.</div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Уже есть подписка? Войти в кабинет →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
