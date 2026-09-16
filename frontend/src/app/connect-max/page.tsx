"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function ConnectMaxPage() {
  const router = useRouter();
  const [status, setStatus] = useState("⏳ Подключаем MAX...");
  const [icon, setIcon] = useState("💬");
  const [maxUserId, setMaxUserId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = localStorage.getItem("auth_token");

    if (!uid) return;

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(`/connect-max?uid=${uid}`)}`);
      return;
    }

    fetch(`${API}/api/max/confirm/${uid}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then(() => {
        setIcon("✅");
        setStatus("MAX подключён! Возвращаемся в кабинет...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      })
      .catch(() => {
        setIcon("😔");
        setStatus("Не удалось подключить. Попробуйте ещё раз.");
      });
  }, [router]);

  const handleManualConnect = async () => {
    if (!maxUserId.trim()) return;
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(`/connect-max?uid=${maxUserId}`)}`);
      return;
    }
    setStatus("⏳ Подключаем...");
    try {
      const r = await fetch(`${API}/api/max/confirm/${maxUserId.trim()}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        setIcon("✅");
        setStatus("MAX подключён! Возвращаемся в кабинет...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      } else {
        const d = await r.json();
        setIcon("😔");
        setStatus(d.error || "Ошибка подключения");
      }
    } catch {
      setIcon("😔");
      setStatus("Ошибка сети");
    }
  };

  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const hasUid = !!urlParams.get("uid");

  if (hasUid) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 relative overflow-hidden isolate">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">{icon}</div>
          <div className="text-xl font-semibold mb-2">{status}</div>
          <div className="text-sm text-slate-400">AI Астролог — гороскопы в MAX</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 relative overflow-hidden isolate">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl mb-6">💬</div>
        <h1 className="text-2xl font-bold mb-4">Подключить MAX</h1>
        <p className="text-slate-400 mb-6">
          Напишите /start боту в MAX, затем введите ваш MAX User ID ниже.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={maxUserId}
            onChange={(e) => setMaxUserId(e.target.value)}
            placeholder="Ваш MAX User ID"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleManualConnect}
            disabled={!maxUserId.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition disabled:opacity-50"
          >
            Подключить
          </button>
        </div>
        <div className="text-sm text-slate-500">{status}</div>
        <a href="https://max.ru/id263211995820_bot" target="_blank" rel="noopener noreferrer"
          className="inline-block mt-4 text-violet-400 hover:text-violet-300 text-sm">
          Открыть бота в MAX →
        </a>
      </div>
    </main>
  );
}
