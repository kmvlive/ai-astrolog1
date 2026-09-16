"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function PaymentSuccess() {
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    let paymentId = localStorage.getItem("pending_payment_id");
    if (!token) {
      setStatus("no_payment");
      return;
    }

    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        if (!paymentId) {
          const lr = await fetch(`${API}/api/payments/last`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const ld = await lr.json();
          if (ld.payment_id) paymentId = String(ld.payment_id);
          else { setStatus("no_payment"); return; }
        }
        const r = await fetch(`${API}/api/payments/${paymentId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        if (data.status === "PAID") {
          setStatus("paid");
          localStorage.removeItem("pending_payment_id");
        } else if (attempts < 10) {
          setTimeout(check, 1500);
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("error");
      }
    };
    check();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {status === "checking" && (
          <>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-violet-500 border-t-transparent mb-6" />
            <h1 className="text-3xl font-bold mb-4">Проверяем оплату...</h1>
            <p className="text-slate-400">Это займёт несколько секунд</p>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="text-7xl mb-6">✅</div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
              Оплата прошла успешно!
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Спасибо за покупку. Ваша подписка активирована.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-semibold"
            >
              Перейти в кабинет →
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <div className="text-7xl mb-6">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Оплата в обработке</h1>
            <p className="text-slate-400 mb-8">
              Подписка активируется автоматически в течение 5 минут.
            </p>
            <Link href="/dashboard" className="text-violet-400 hover:text-violet-300">
              Вернуться в кабинет →
            </Link>
          </>
        )}
        {(status === "no_payment" || status === "error") && (
          <>
            <div className="text-7xl mb-6">🤔</div>
            <h1 className="text-3xl font-bold mb-4">Платёж не найден</h1>
            <Link href="/pricing" className="text-violet-400 hover:text-violet-300">
              Выбрать тариф →
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
