"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Subscription = {
  status: string;
  plan_type: string;
  expires_at: string | null;
  trial_ends_at?: string | null;
  auto_renew?: boolean;
  rebill_id?: string | null;
};

type Payment = {
  id: number;
  plan_name: string;
  amount: string;
  status: string;
  created_at: string;
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [autoRenew, setAutoRenew] = useState(false);
  const [rebillId, setRebillId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.subscription) {
          setSubscription(d.subscription);
          setAutoRenew(!!d.subscription.auto_renew);
          setRebillId(d.subscription.rebill_id || null);
        }
      })
      .catch(() => {});
    fetch(`${API_URL}/api/payments/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPayments(d?.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const EPOCH = new Date("1970-01-02").getTime();
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : 0;
  const trialEnds = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).getTime() : 0;
  const isActive = !!subscription && subscription.status === "active" && expiresAt > now && expiresAt > EPOCH;
  const isTrial = !!subscription && subscription.status === "trial" && trialEnds > now;
  const daysLeft = isActive ? Math.ceil((expiresAt - now) / 86400000) : 0;
  const trialDaysLeft = isTrial ? Math.ceil((trialEnds - now) / 86400000) : 0;

  const planNames: Record<string, string> = { week: "Неделя", month: "Месяц", year: "Год" };

  const toggleAutoRenew = async (enabled: boolean) => {
    const token = localStorage.getItem("auth_token");
    if (!token || !subscription) return;
    setAutoSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/subscription/auto-renew`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await r.json();
      if (data.success) setAutoRenew(enabled);
      else alert(data.message || "Не удалось изменить настройку");
    } catch {
      alert("Ошибка сети");
    } finally {
      setAutoSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-4" />
          <div>Загрузка...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
          Подписка
        </h1>

        {isActive || isTrial ? (
          <div className="rounded-2xl p-6 border bg-gradient-to-br from-violet-900/30 to-slate-900 border-violet-500/30 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Тариф</div>
                <div className="text-2xl font-bold">
                  {planNames[subscription!.plan_type] || subscription!.plan_type}
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
                {isTrial ? "Пробный период" : "Активна"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">{isTrial ? "Триал до" : "Действует до"}</div>
                <div className="text-lg font-semibold">
                  {new Date(isTrial ? trialEnds : expiresAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Осталось</div>
                <div className="text-lg font-semibold">
                  {isTrial ? `${trialDaysLeft} дн.` : `${daysLeft} дн.`}
                </div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="inline-block px-6 py-3 rounded-xl font-semibold bg-violet-600 hover:bg-violet-500 text-white transition"
            >
              Продлить или сменить тариф
            </Link>

            {!isTrial && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      💳 Автопродление
                      {rebillId ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Карта привязана
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          Карта не привязана
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {rebillId
                        ? "За день до окончания спишем автоматически"
                        : "Чтобы включить — продлите подписку с галочкой «Автопродление»"}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      disabled={autoSaving || !rebillId}
                      onChange={(e) => toggleAutoRenew(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-8 bg-slate-900 border border-white/10 text-center mb-8">
            <div className="text-5xl mb-4">💎</div>
            <div className="text-xl font-semibold mb-2">У вас пока нет активной подписки</div>
            <div className="text-slate-400 mb-6">
              Выберите тариф — и откройте все персональные гороскопы
            </div>
            <Link
              href="/pricing"
              className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-3 rounded-xl font-semibold transition"
            >
              Выбрать тариф
            </Link>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">История платежей</h2>
        {payments.length === 0 ? (
          <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 text-center text-slate-400">
            Платежей пока не было
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-white/10 divide-y divide-white/5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold">{p.plan_name}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{Number(p.amount).toLocaleString("ru-RU")} ₽</div>
                  <div
                    className={`text-xs ${
                      p.status === "CONFIRMED"
                        ? "text-green-400"
                        : p.status === "CANCELED"
                        ? "text-red-400"
                        : "text-slate-400"
                    }`}
                  >
                    {p.status === "CONFIRMED" ? "Оплачен" : p.status === "CANCELED" ? "Отменён" : p.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/dashboard" className="text-violet-400 hover:text-violet-300">
            ← В личный кабинет
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
