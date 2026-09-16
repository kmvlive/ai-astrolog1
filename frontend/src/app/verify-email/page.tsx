"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "ok" | "already" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      setMessage("В ссылке нет токена.");
      return;
    }

    fetch(`${API}/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        const msg = data?.message || "";
        if (r.ok) {
          if (/уже|already/i.test(msg)) {
            setState("already");
            setMessage(msg);
          } else {
            setState("ok");
            setMessage(msg);
          }
        } else {
          setState("error");
          setMessage(msg || "Ссылка недействительна или истекла.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Не удалось связаться с сервером.");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 relative overflow-hidden isolate">
      <div className="text-center max-w-md">
        {state === "loading" && (
          <>
            <div className="text-6xl mb-6">⏳</div>
            <div className="text-xl font-semibold">Подтверждаем email...</div>
          </>
        )}
        {state === "ok" && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-2xl font-bold mb-3">Email подтверждён!</h1>
            <p className="text-slate-400 mb-8">
              Теперь вы будете получать персональные гороскопы каждое утро в 8:00 — на почту и в Telegram.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/dashboard" className="bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition">В кабинет</Link>
              <Link href="/horoscopes" className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl px-6 py-3 font-semibold transition">К гороскопам</Link>
            </div>
          </>
        )}
        {state === "already" && (
          <>
            <div className="text-6xl mb-6">✨</div>
            <h1 className="text-2xl font-bold mb-3">Email уже подтверждён</h1>
            <p className="text-slate-400 mb-8">{message || "Всё в порядке — вы давно с нами!"}</p>
            <Link href="/dashboard" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition">В кабинет</Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="text-6xl mb-6">😔</div>
            <h1 className="text-2xl font-bold mb-3">Не удалось подтвердить email</h1>
            <p className="text-slate-400 mb-8">{message}</p>
            <Link href="/login" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition">Войти в кабинет</Link>
          </>
        )}
      </div>
    </main>
  );
}
