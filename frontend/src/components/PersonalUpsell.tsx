"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type State = "loading" | "guest" | "enabled" | "disabled";

export default function PersonalUpsell() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) { setState("guest"); return; }
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("auth"))))
      .then((d) => setState(d?.free_personal_enabled ? "enabled" : "disabled"))
      .catch(() => setState("guest"));
  }, []);

  if (state === "loading") return null;

  if (state === "enabled") {
    return (
      <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-6 py-4 text-center">
        <p className="text-sm text-emerald-300">
          ✓ Персональный гороскоп у вас включён — каждое утро он приходит на почту.{" "}
          <Link href="/dashboard" className="underline decoration-emerald-500/40 hover:text-emerald-200 transition">Настройки →</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-900/40 to-amber-900/20 p-8 text-center">
      <span className="cal-shine" aria-hidden="true" />
      <div className="relative z-10">
        <div className="text-4xl mb-3">✨</div>
        <h2 className="text-2xl font-bold mb-3 text-white">Хотите прогноз только для вас?</h2>
        <p className="text-slate-300 mb-6 max-w-xl mx-auto">
          Персональный гороскоп по дате, времени и месту рождения — точнее любого общего прогноза
        </p>
        <Link href="/pricing" className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-8 py-3 rounded-xl transition shadow-lg shadow-amber-500/20">
          Получить персональный гороскоп
        </Link>
      </div>
    </div>
  );
}
