"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function ConnectTelegramPage() {
  const router = useRouter();
  const [status, setStatus] = useState("⏳ Подключаем Telegram...");
  const [icon, setIcon] = useState("🤖");

  useEffect(() => {
    const chat = new URLSearchParams(window.location.search).get("chat");
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

    if (!chat) {
      router.replace("/dashboard");
      return;
    }

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(`/connect-telegram?chat=${chat}`)}`);
      return;
    }

    fetch(`${API}/api/telegram/confirm/${chat}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad response"))))
      .then(() => {
        setIcon("✅");
        setStatus("Telegram подключён! Возвращаемся в кабинет...");
        setTimeout(() => router.replace("/dashboard"), 1500);
      })
      .catch(() => {
        setIcon("😔");
        setStatus("Не удалось подключить. Попробуйте ещё раз из Telegram.");
      });
  }, [router]);

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-4 relative overflow-hidden isolate">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{icon}</div>
        <div className="text-xl font-semibold mb-2">{status}</div>
        <div className="text-sm text-slate-400">AI Астролог — гороскопы в Telegram</div>
      </div>
    </main>
  );
}
