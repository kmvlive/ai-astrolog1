"use client";

import { useEffect, useState } from "react";

export default function ShareBlock({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const enc = (s: string) => encodeURIComponent(s);
  const open = (link: string) =>
    window.open(link, "_blank", "width=640,height=520,noopener");

  const share = (net: "tg" | "vk" | "wa" | "ok" | "copy") => {
    if (!url) return;
    const u = enc(url);
    const t = enc(title);
    if (net === "tg") open(`https://t.me/share/url?url=${u}&text=${t}`);
    if (net === "vk") open(`https://vk.com/share.php?url=${u}&title=${t}`);
    if (net === "wa") open(`https://api.whatsapp.com/send?text=${t}%20${u}`);
    if (net === "ok") open(`https://connect.ok.ru/offer?url=${u}&title=${t}`);
    if (net === "copy") {
      navigator.clipboard
        ?.writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  const btn =
    "px-4 py-2 rounded-xl text-sm font-semibold border transition hover:-translate-y-0.5";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-slate-400 mr-1">Поделиться:</span>
      <button onClick={() => share("tg")} className={`${btn} bg-sky-600/20 border-sky-500/40 text-sky-300 hover:bg-sky-600/40`}>
        ✈️ Telegram
      </button>
      <button onClick={() => share("vk")} className={`${btn} bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/40`}>
        💙 VK
      </button>
      <button onClick={() => share("wa")} className={`${btn} bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40`}>
        📱 WhatsApp
      </button>
      <button onClick={() => share("ok")} className={`${btn} bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600/40`}>
        👌 OK
      </button>
      <button onClick={() => share("copy")} className={`${btn} bg-slate-700/40 border-slate-500/40 text-slate-300 hover:bg-slate-600/40`}>
        {copied ? "✓ Скопировано" : "🔗 Копировать"}
      </button>
    </div>
  );
}
