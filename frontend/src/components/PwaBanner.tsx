"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa_banner_dismissed_at";
const DISMISS_MS = 60 * 24 * 60 * 60 * 1000; // 2 месяца

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return (
    (/iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    !(window as any).MSStream
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="inline-block -mt-0.5">
      <path d="M12 3v12" />
      <path d="M7.5 7.5L12 3l4.5 4.5" />
      <path d="M5 11h-1a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

export default function PwaBanner() {
  const [mode, setMode] = useState<"prompt" | "ios" | null>(null);
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    console.log("[PWA] Banner component mounted");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        () => console.log("[PWA] Service Worker registered"),
        (err) => console.error("[PWA] SW registration failed:", err)
      );
    }

    // Принудительный показ для теста
    if (localStorage.getItem("pwa_force_show") === "1") {
      console.log("[PWA] Force show triggered");
      setMode("prompt");
      localStorage.removeItem("pwa_force_show");
      return;
    }

    // Тест-режим с десктопа
    if (new URLSearchParams(location.search).has("pwa_ios")) {
      setMode("ios");
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone;
    if (standalone) return;

    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - ts < DISMISS_MS) return;

    // iOS: beforeinstallprompt нет — показываем подсказку
    if (isIOS()) {
      setMode("ios");
      return;
    }

    // Android / десктоп Chrome: ждём системное событие
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setMode("prompt");
    };
    const onInstalled = () => {
      setMode(null);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setMode(null);
    setDeferred(null);
  };

  const dismiss = () => {
    setMode(null);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!mode) return null;

  // iOS-подсказка: внизу слева (рядом с кнопкой «Поделиться»)
  if (mode === "ios") {
    return (
      <div className="fixed left-4 bottom-4 z-[60] w-[270px] rounded-xl border border-violet-500/40 bg-[#14102a]/95 backdrop-blur p-3 shadow-xl shadow-violet-900/40">
        <button
          onClick={dismiss}
          aria-label="Закрыть"
          className="absolute right-2 top-2 text-slate-500 hover:text-white transition text-sm"
        >
          ✕
        </button>
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="w-9 h-9 rounded-lg shrink-0" />
          <div className="text-[11px] text-slate-300 leading-relaxed">
            <div className="text-sm font-bold text-white mb-1">AI Астролог на домашнем экране</div>
            <div className="mb-1">
              1. Нажмите <ShareIcon /> <b>«Поделиться»</b>
            </div>
            <div className="mb-1.5">
              2. Выберите <b>«На домашний экран»</b>
            </div>
            <button
              onClick={dismiss}
              className="w-full py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android / десктоп: системная установка
  return (
    <div className="fixed left-4 top-20 z-[60] w-[260px] rounded-xl border border-violet-500/40 bg-[#14102a]/95 backdrop-blur p-3 shadow-xl shadow-violet-900/40">
      <button
        onClick={dismiss}
        aria-label="Закрыть"
        className="absolute right-2 top-2 text-slate-500 hover:text-white transition text-sm"
      >
        ✕
      </button>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="w-9 h-9 rounded-lg shrink-0" />
        <div>
          <div className="text-sm font-bold text-white mb-0.5">AI Астролог</div>
          <div className="text-[11px] text-slate-400 leading-snug mb-2">
            Установите приложение — гороскопы и руна дня будут под рукой
          </div>
          <button
            onClick={install}
            className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-violet-500 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            📲 Установить
          </button>
        </div>
      </div>
    </div>
  );
}
