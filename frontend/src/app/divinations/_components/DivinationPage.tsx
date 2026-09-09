"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AdBlock from "@/components/AdBlock";
import SiteFooter from "@/components/SiteFooter";
import DivinationAnimation from "@/components/DivinationAnimation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Props {
  type: string;
  title: string;
  emoji: string;
  description: string;
  gradient: string;
  hasQuestion?: boolean;
  hasBirthdate?: boolean;
  placeholder?: string;
}

const ALL_DIVINATIONS = [
  { slug: "tarot-yes-no", emoji: "🃏", name: "Таро Да/Нет" },
  { slug: "celtic-cross", emoji: "✝️", name: "Кельтский крест" },
  { slug: "tarot-love", emoji: "💕", name: "На любовь" },
  { slug: "tarot-future", emoji: "🔮", name: "На будущее" },
  { slug: "tarot-birthdate", emoji: "⭐", name: "По дате рождения" },
  { slug: "coffee-grounds", emoji: "☕", name: "На кофейной гуще" },
  { slug: "runes", emoji: "ᚱ", name: "На рунах" },
];

export default function DivinationPage({
  type,
  title,
  emoji,
  description,
  gradient,
  hasQuestion = true,
  hasBirthdate = false,
  placeholder = "Задайте свой вопрос...",
}: Props) {
  const [question, setQuestion] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUuid, setShareUuid] = useState<string | null>(null);

  const ask = async () => {
    if (loading) return;
    setLoading(true);
    setPrediction(null);
    setShareUuid(null);

    setTimeout(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const r = await fetch(`${API}/api/divination/${type}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            question: question.trim(),
            extra: hasBirthdate ? { birthdate } : {},
          }),
        });
        const data = await r.json();
        setPrediction(data.prediction);
        setShareUuid(data.uuid ?? null);
      } catch {
        setPrediction("Оракул временно недоступен... Попробуйте позже.");
      } finally {
        setLoading(false);
      }
    }, 2500);
  };

  const shareUrl =
    typeof window !== "undefined"
      ? shareUuid ? `${window.location.origin}/share/${shareUuid}` : window.location.href
      : "";

  const share = async () => {
    if (!prediction) return;
    const text = `${emoji} ${title}\n\n${prediction}\n\n— ${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const renderPrediction = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-bold text-violet-200">{part}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Хлебные крошки */}
        <div className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300">Главная</Link>
          {" → "}
          <Link href="/divinations" className="hover:text-slate-300">Гадания</Link>
          {" → "}
          <span className="text-slate-300">{title}</span>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className={`text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {title}
          </h1>
          <p className="text-slate-400 text-lg">{description}</p>
        </div>

        {/* Форма */}
        <div className="mb-8 space-y-4">
          {hasQuestion && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Ваш вопрос</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 resize-none"
              />
            </div>
          )}

          {hasBirthdate && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Дата рождения</label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:outline-none focus:border-violet-400/60"
              />
            </div>
          )}

          <button
            onClick={ask}
            disabled={loading || (hasBirthdate && !birthdate)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition shadow-lg shadow-violet-500/20"
          >
            {loading ? "✨ Оракул думает..." : `${emoji} Погадать`}
          </button>
        </div>

        {/* Результат */}
        {loading && <DivinationAnimation type={type} emoji={emoji} />}

        {prediction && !loading && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-900/30 to-amber-900/20 border border-violet-500/20">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-violet-300 mb-1">
                    Предсказание
                  </div>
                  <div className="text-white text-lg leading-relaxed whitespace-pre-line">
                    {renderPrediction(prediction)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={share}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition"
              >
                {shareCopied ? "✅ Скопировано!" : "📋 Поделиться"}
              </button>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${emoji} ${title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-sm font-medium transition"
              >
                🤖 Telegram
              </a>
              <a
                href={`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`${emoji} ${title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium transition"
              >
                💙 VK
              </a>
            </div>

            <div className="text-center">
              <button
                onClick={ask}
                className="px-8 py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-medium transition"
              >
                🔄 Погадать ещё раз
              </button>
            </div>
          </div>
        )}

        <AdBlock />

        {/* Другие гадания */}
        <div className="mt-10">
          <h3 className="text-lg font-bold mb-4 text-center">Другие гадания</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ALL_DIVINATIONS.filter((d) => d.slug !== type)
              .slice(0, 4)
              .map((d) => (
                <Link
                  key={d.slug}
                  href={`/divinations/${d.slug}`}
                  className="p-3 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/20 text-center transition"
                >
                  <div className="text-2xl mb-1">{d.emoji}</div>
                  <div className="text-xs text-slate-300">{d.name}</div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
