"use client";
import { useState } from "react";

export default function CalShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button onClick={copy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition">
        {copied ? "✅ Скопировано!" : "📋 Скопировать ссылку"}
      </button>
      <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-sm font-medium transition">
        🤖 Telegram
      </a>
      <a href={`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium transition">
        💙 VK
      </a>
    </div>
  );
}
