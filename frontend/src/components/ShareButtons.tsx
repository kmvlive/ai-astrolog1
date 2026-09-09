"use client";

import { useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = (network: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    const e = encodeURIComponent;
    const links: Record<string, string> = {
      tg: `https://t.me/share/url?url=${e(url)}&text=${e(text)}`,
      vk: `https://vk.com/share.php?url=${e(url)}&title=${e(text)}&description=${e(text)}&noparse=1`,
      wa: `https://wa.me/?text=${e(text + "\n" + url)}`,
      ok: `https://connect.ok.ru/offer?url=${e(url)}&title=${e(text)}`,
    };
    window.open(links[network], "_blank", "width=700,height=600");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const btn = "flex items-center justify-center w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-lg transition";

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <span className="text-sm text-slate-400 mr-1">Поделиться:</span>
      <button onClick={() => share("tg")} className={btn} title="Telegram">✈️</button>
      <button onClick={() => share("vk")} className={btn} title="ВКонтакте">
        <span className="text-xs font-bold text-sky-400">VK</span>
      </button>
      <button onClick={() => share("wa")} className={btn} title="WhatsApp">💬</button>
      <button onClick={() => share("ok")} className={btn} title="Одноклассники">
        <span className="text-xs font-bold text-orange-400">OK</span>
      </button>
      <button onClick={copy} className={btn} title="Скопировать ссылку">
        {copied ? "✅" : "🔗"}
      </button>
    </div>
  );
}
