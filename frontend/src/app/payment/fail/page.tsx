"use client";

import CometField from "@/components/CometField";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function PaymentFail() {
  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-7xl mb-6">😔</div>
        <h1 className="text-4xl font-bold mb-4">Оплата не прошла</h1>
        <p className="text-lg text-slate-400 mb-8">
          Что-то пошло не так. Деньги не списаны.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-semibold"
        >
          Вернуться к тарифам →
        </Link>
      </div>
    </main>
  );
}
