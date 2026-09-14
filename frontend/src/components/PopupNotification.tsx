"use client";

import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Popup {
  id: number;
  title: string;
  body: string;
  icon: string;
  link_url?: string;
  link_text?: string;
  dismiss_text?: string;
  type: "info" | "promo" | "urgent" | "horoscope";
}

const typeStyles: Record<string, string> = {
  info: "from-blue-900/40 to-slate-900/90 border-blue-500/30",
  promo: "from-green-900/40 to-slate-900/90 border-green-500/30",
  urgent: "from-red-900/40 to-slate-900/90 border-red-500/30",
  horoscope: "from-violet-900/40 to-slate-900/90 border-violet-500/30",
};

const btnStyles: Record<string, string> = {
  info: "bg-blue-600 hover:bg-blue-500",
  promo: "bg-green-600 hover:bg-green-500",
  urgent: "bg-red-600 hover:bg-red-500",
  horoscope: "bg-violet-600 hover:bg-violet-500",
};

export default function PopupNotification() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    // Небольшая задержка чтобы не мешать загрузке страницы
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/popups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.popups && data.popups.length > 0) {
          setPopup(data.popups[0]);
          setVisible(true);
        }
      } catch {}
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = async () => {
    if (!popup) return;
    setClosing(true);
    
    const token = localStorage.getItem("auth_token");
    try {
      await fetch(`${API}/popups/${popup.id}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}

    setTimeout(() => {
      setVisible(false);
      setPopup(null);
      setClosing(false);
    }, 300);
  };

  const handleLink = () => {
    if (popup?.link_url) {
      dismiss();
      if (popup.link_url.startsWith("http")) {
        window.open(popup.link_url, "_blank");
      } else {
        window.location.href = popup.link_url;
      }
    }
  };

  if (!visible || !popup) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={dismiss}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl border bg-gradient-to-br ${typeStyles[popup.type] || typeStyles.info} p-6 shadow-2xl transform transition-all duration-300 ${closing ? "scale-95" : "scale-100"}`}>
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition text-xl leading-none"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="text-4xl mb-3">{popup.icon}</div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-2 text-white">{popup.title}</h3>

        {/* Body */}
        <p className="text-slate-300 text-sm leading-relaxed mb-5 whitespace-pre-line">{popup.body}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          {popup.link_url && (
            <button
              onClick={handleLink}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition ${btnStyles[popup.type] || btnStyles.info}`}
            >
              {popup.link_text || "Подробнее"}
            </button>
          )}
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition"
          >
            {popup.dismiss_text || "Закрыть"}
          </button>
        </div>
      </div>
    </div>
  );
}
