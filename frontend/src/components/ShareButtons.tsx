"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButtons({
  title = "Поделиться",
  text,
  url,
  className = "",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || document.title;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const shareLinks = [
    {
      name: "Telegram",
      icon: "📨",
      color: "bg-blue-500 hover:bg-blue-600",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: "WhatsApp",
      icon: "💬",
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: "VK",
      icon: "🔵",
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedText}`,
    },
    {
      name: "Twitter",
      icon: "🐦",
      color: "bg-sky-500 hover:bg-sky-600",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
  ];

  return (
    <div className={`bg-slate-900/50 border border-white/10 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-bold mb-4 text-center">📤 {title}</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.color} text-white rounded-xl px-4 py-3 font-semibold transition flex items-center justify-center gap-2 text-sm`}
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.name}</span>
          </a>
        ))}
      </div>

      <button
        onClick={copyLink}
        className={`w-full rounded-xl px-4 py-3 font-semibold transition flex items-center justify-center gap-2 ${
          copied
            ? "bg-green-600 text-white"
            : "bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
        }`}
      >
        {copied ? (
          <>
            <span>✓</span>
            <span>Ссылка скопирована!</span>
          </>
        ) : (
          <>
            <span>🔗</span>
            <span>Копировать ссылку</span>
          </>
        )}
      </button>
    </div>
  );
}
