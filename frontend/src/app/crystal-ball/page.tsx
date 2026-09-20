"use client";

import CometField from "@/components/CometField";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AdBlock from "@/components/AdBlock";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function CrystalBallPage() {
  const [question, setQuestion] = useState("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const ballRef = useRef<HTMLDivElement>(null);

  // Плавающие частицы
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }))
  );

  const askBall = async () => {
    if (loading) return;
    setLoading(true);
    setShaking(true);
    setGlowing(true);
    setPrediction(null);

    // Анимация тряски 2 секунды
    setTimeout(async () => {
      try {
        const r = await fetch(`${API}/api/crystal-ball/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim() }),
        });
        const data = await r.json();
        setPrediction(data.prediction);
        if (data.prediction) {
          setHistory((prev) => [
            { q: question.trim() || "Общее предсказание", a: data.prediction },
            ...prev.slice(0, 4),
          ]);
        }
      } catch {
        setPrediction("Хрустальный шар помутнел... Попробуйте ещё раз.");
      } finally {
        setLoading(false);
        setShaking(false);
        setTimeout(() => setGlowing(false), 1000);
      }
    }, 2000);
  };

  
  const sharePrediction = async () => {
    if (!prediction) return;
    const text = `🔮 Предсказание хрустального шара:\n\n«${prediction}»\n\n— my.neiro-astro.ru/crystal-ball`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "🔮 Хрустальный Шар", text, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askBall();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />

      {/* Звёздный фон */}
      <div className="fixed inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-violet-400/30 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <span>🔮</span>
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-amber-400 bg-clip-text text-transparent">Хрустальный Шар</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Задайте вопрос — и древний оракул откроет завесу будущего
          </p>
        </div>

        {/* Шар 3D */}
        <div className="flex justify-center mb-8">
          <div
            ref={ballRef}
            className={`crystal-ball-scene ${shaking ? "crystal-shaking" : ""} ${glowing ? "crystal-glowing" : ""} ${prediction ? "crystal-active" : ""}`}
            onClick={!loading ? askBall : undefined}
          >
            {/* Внешнее свечение */}
            <div className="crystal-aura" />
            
            {/* Сфера */}
            <div className="crystal-sphere">
              {/* Туман внутри */}
              <div className="crystal-mist" />
              
              {/* Пульсирующее ядро */}
              <div className="crystal-core" />
              
              {/* Вращающиеся блики */}
              <div className="crystal-highlight crystal-highlight-1" />
              <div className="crystal-highlight crystal-highlight-2" />
              <div className="crystal-highlight crystal-highlight-3" />
              
              {/* Верхний блик (стекло) */}
              <div className="crystal-glass-top" />
              <div className="crystal-glass-shine" />
              
              {/* Контент внутри */}
              <div className="crystal-content">
                {loading ? (
                  <div className="crystal-loading">
                    <div className="crystal-loading-spinner">✨</div>
                    <div className="crystal-loading-text">Шар смотрит в будущее...</div>
                  </div>
                ) : prediction ? (
                  <div className="crystal-prediction">«{prediction}»</div>
                ) : (
                  <div className="crystal-idle">
                    <div className="crystal-idle-emoji">🔮</div>
                    <div className="crystal-idle-hint">Нажмите на шар</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Подставка */}
            <div className="crystal-stand-base" />
            <div className="crystal-stand-top" />
            <div className="crystal-stand-glow" />
          </div>
        </div>

        {/* Поле ввода вопроса */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Задайте свой вопрос хрустальному шару..."
              disabled={loading}
              className="w-full px-5 py-4 pr-14 rounded-2xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 transition text-lg "
            />
            <button
              onClick={askBall}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition flex items-center justify-center text-lg"
            >
              {loading ? "⏳" : "🔮"}
            </button>
          </div>
          <div className="text-center mt-2 text-xs text-slate-500">
            Или нажмите прямо на шар • Enter для отправки
          </div>
        </div>

        {/* Предсказание под шаром (дублируем для удобства чтения) */}
        {prediction && !loading && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/20 ">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🔮</span>
              <div>
                <div className="text-violet-300 text-xs uppercase tracking-wider mb-2">
                  Предсказание оракула
                </div>
                <p className="text-violet-100 text-lg leading-relaxed italic">
                  «{prediction}»
                </p>
              </div>
            </div>
          </div>
        )}

        
        {/* Блок Поделиться */}
        {prediction && !loading && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={sharePrediction}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition"
            >
              {shareCopied ? "✅ Скопировано!" : "📋 Поделиться"}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent("https://my.neiro-astro.ru/crystal-ball")}&text=${encodeURIComponent("🔮 Предсказание хрустального шара: «" + prediction.slice(0, 100) + "...»")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-sm font-medium transition"
            >
              🤖 Telegram
            </a>
            <a
              href={`https://vk.com/share.php?url=${encodeURIComponent("https://my.neiro-astro.ru/crystal-ball")}&title=${encodeURIComponent("🔮 Предсказание хрустального шара")}&description=${encodeURIComponent(prediction.slice(0, 200))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-medium transition"
            >
              💙 ВКонтакте
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("🔮 Предсказание хрустального шара: «" + prediction.slice(0, 100) + "...» — my.neiro-astro.ru/crystal-ball")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 text-sm font-medium transition"
            >
              💬 WhatsApp
            </a>
          </div>
        )}

        {/* История предсказаний */}
        {history.length > 1 && (
          <div className="mb-8">
            <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-3">
              📜 Previous prophecies
            </h3>
            <div className="space-y-2">
              {history.slice(1).map((h, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-sm"
                >
                  <div className="text-slate-500 text-xs mb-1">
                    {h.q !== "Общее предсказание" ? `❓ ${h.q}` : "🔮 Общее"}
                  </div>
                  <div className="text-slate-300 italic">«{h.a}»</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <AdBlock />
      </div>

      
      {/* JSON-LD для SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Хрустальный Шар — AI предсказание",
            description: "Задайте вопрос хрустальному шару и получите мистическое AI-предсказание онлайн бесплатно.",
            url: "https://my.neiro-astro.ru/crystal-ball",
            applicationCategory: "EntertainmentApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
            author: { "@type": "Organization", name: "AI Астролог", url: "https://my.neiro-astro.ru" },
          }),
        }}
      />

      <SiteFooter />
    </main>
  );
}
