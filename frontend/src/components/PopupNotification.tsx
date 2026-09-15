"use client";

import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Popup {
  id?: number;
  title: string;
  body: string;
  icon: string;
  link_url?: string;
  link_text?: string;
  dismiss_text?: string;
  type: "info" | "promo" | "urgent" | "horoscope" | "welcome";
}

interface ToastItem extends Popup {
  closing?: boolean;
  isWelcome?: boolean;
}

const borderColors: Record<string, string> = {
  info: "border-blue-500/40",
  promo: "border-green-500/40",
  urgent: "border-red-500/40",
  horoscope: "border-violet-500/40",
  welcome: "border-amber-500/40",
};

const accentColors: Record<string, string> = {
  info: "bg-blue-500",
  promo: "bg-green-500",
  urgent: "bg-red-500",
  horoscope: "bg-violet-500",
  welcome: "bg-amber-500",
};

export default function PopupNotification() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    const timer = setTimeout(async () => {
      try {
        // 1. Сначала проверяем приветственный popup
        const welcomeRes = await fetch(`${API}/api/popups/welcome`, { headers });
        if (welcomeRes.ok) {
          const welcomeData = await welcomeRes.json();
          if (welcomeData.show && welcomeData.popup) {
            setToasts(prev => [...prev, { ...welcomeData.popup, isWelcome: true, type: "welcome" }]);
            
            // Если есть welcome — обычные показываем с доп. задержкой
            setTimeout(() => fetchRegularPopups(headers), 1500);
            return;
          }
        }

        // 2. Обычные popups
        await fetchRegularPopups(headers);
      } catch {}
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const fetchRegularPopups = async (headers: HeadersInit) => {
    try {
      const res = await fetch(`${API}/api/popups`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data.popups && data.popups.length > 0) {
        data.popups.forEach((p: Popup, i: number) => {
          setTimeout(() => {
            setToasts(prev => [...prev, p]);
          }, i * 400);
        });
      }
    } catch {}
  };

  const dismiss = async (toast: ToastItem) => {
    // Анимация закрытия
    setToasts(prev => prev.map(t => 
      (t.isWelcome ? t.isWelcome === toast.isWelcome : t.id === toast.id) 
        ? { ...t, closing: true } : t
    ));

    // Ждём сохранения на сервере
    const token = localStorage.getItem("auth_token");
    try {
      if (toast.isWelcome) {
        await fetch(`${API}/api/popups/welcome/dismiss`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (toast.id) {
        await fetch(`${API}/api/popups/${toast.id}/dismiss`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}

    // Удаляем из UI после сохранения
    setToasts(prev => prev.filter(t => 
      toast.isWelcome ? !t.isWelcome : t.id !== toast.id
    ));
  };

  const handleLink = async (toast: ToastItem) => {
    if (!toast.link_url) return;
    
    const url = toast.link_url;
    
    // Сначала сохраняем dismiss на сервере, ждём ответа
    const token = localStorage.getItem("auth_token");
    try {
      if (toast.isWelcome) {
        await fetch(`${API}/api/popups/welcome/dismiss`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (toast.id) {
        await fetch(`${API}/api/popups/${toast.id}/dismiss`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    
    // Убираем из UI
    setToasts(prev => prev.filter(t =>
      toast.isWelcome ? !t.isWelcome : t.id !== toast.id
    ));
    
    // Переходим ПОСЛЕ сохранения
    if (url.startsWith("http")) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast, idx) => (
        <div
          key={toast.isWelcome ? "welcome" : toast.id}
          className={`pointer-events-auto relative rounded-xl border ${borderColors[toast.type] || borderColors.info} bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 ${toast.closing ? "opacity-0 translate-x-full scale-95" : "opacity-100 translate-x-0 scale-100"}`}
          style={{ animation: toast.closing ? undefined : "slideInRight 0.4s ease-out" }}
        >
          {/* Accent line */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColors[toast.type] || accentColors.info}`} />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{toast.icon}</span>
                <h4 className="font-semibold text-sm text-white leading-tight">{toast.title}</h4>
              </div>
              <button
                onClick={() => dismiss(toast)}
                className="text-slate-500 hover:text-white transition text-xs leading-none shrink-0 mt-0.5"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <p className="text-slate-400 text-xs leading-relaxed mb-3 whitespace-pre-line">{toast.body}</p>

            {/* Actions */}
            {(toast.link_url || toast.dismiss_text) && (
              <div className="flex gap-2">
                {toast.link_url && toast.link_text && (
                  <button
                    onClick={() => handleLink(toast)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition ${accentColors[toast.type] || accentColors.info} hover:opacity-80`}
                  >
                    {toast.link_text}
                  </button>
                )}
                {toast.dismiss_text && (
                  <button
                    onClick={() => dismiss(toast)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition"
                  >
                    {toast.dismiss_text}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <style jsx global>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
