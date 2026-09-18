"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

interface Props {
  type: string;
  emoji: string;
}

// Уникальные имена keyframes (префикс dv-) чтобы НЕ конфликтовать с Tailwind
const CSS = `
@keyframes dv-shuffle { 0%,100% { translate: 0 0; } 50% { translate: 8px -10px; } }
@keyframes dv-appear { from { opacity: 0; transform: translate(-50%,-50%) scale(0) rotate(180deg); } to { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(0deg); } }
@keyframes dv-glow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes dv-heartbeat { 0%,100% { transform: scale(1); } 25% { transform: scale(1.15); } 50% { transform: scale(.95); } 75% { transform: scale(1.08); } }
@keyframes dv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes dv-float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(10px,-10px); } }
@keyframes dv-twinkle { 0%,100% { opacity: .3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.25); } }
@keyframes dv-wobble { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes dv-steam { 0% { opacity: 0; transform: translateY(0) scale(.8); } 50% { opacity: .6; } 100% { opacity: 0; transform: translateY(-22px) scale(1.2); } }
@keyframes dv-fadein { from { opacity: 0; } to { opacity: 1; } }
@keyframes dv-rune-fall { 0% { transform: translateY(-40px) rotate(0deg); opacity: 0; } 10% { opacity: .9; } 90% { opacity: .9; } 100% { transform: translateY(170px) rotate(360deg); opacity: 0; } }
@keyframes dv-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.dv-spin { animation: dv-spin 4s linear infinite; }
.dv-float { animation: dv-float 3s ease-in-out infinite; }
.dv-twinkle { animation: dv-twinkle 2s ease-in-out infinite; }
.dv-wobble { animation: dv-wobble 2s ease-in-out infinite; }
.dv-steam { animation: dv-steam 2s ease-out infinite; }
.dv-fadein { animation: dv-fadein .5s ease-out forwards; opacity: 0; }
.dv-rune { animation: dv-rune-fall 3s ease-in-out infinite; }
.dv-bounce { animation: dv-bounce 2s ease-in-out infinite; }
.dv-heart { animation: dv-heartbeat 1.5s ease-in-out infinite; }
.dv-glow { animation: dv-glow 2s ease-in-out infinite; }
`;

// 🃏 Таро — перетасовка колоды
const TarotAnimation = () => {
  const cards = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="relative h-56 flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: 280, height: 140 }}>
        {cards.map((i) => (
          <div
            key={i}
            className="tarot-mini-back absolute"
            style={{
              left: `${40 + Math.sin(i * 0.9) * 95}px`,
              top: `${20 + Math.cos(i * 0.9) * 40}px`,
              transform: `rotate(${(i - 4) * 10}deg)`,
              animation: `dv-shuffle ${0.9 + i * 0.12}s ease-in-out ${i * 0.08}s infinite alternate`,
            }}
          >
            <div className="tarot-mini-back-inner">✦</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✝️ Кельтский крест — 10 карт появляются по очереди
const CelticCrossAnimation = () => {
  const positions = [
    { x: 50, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 22 }, { x: 50, y: 78 },
    { x: 26, y: 50 }, { x: 74, y: 50 }, { x: 88, y: 15 }, { x: 88, y: 38 },
    { x: 88, y: 62 }, { x: 88, y: 85 },
  ];
  return (
    <div className="relative h-52 flex items-center justify-center overflow-hidden">
      <div className="relative w-64 h-44">
        {positions.map((p, i) => (
          <div
            key={i}
            className="absolute w-10 h-14 bg-gradient-to-br from-indigo-700 to-violet-900 rounded-md border border-violet-300/40 shadow-md"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `dv-appear .5s ease-out ${i * 0.18}s both, dv-glow 2.4s ease-in-out ${i * 0.18}s infinite`,
              transform: "translate(-50%,-50%)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 💕 Любовь — два сердца
const LoveAnimation = () => (
  <div className="relative h-52 flex items-center justify-center gap-10 overflow-hidden">
    <span className="text-6xl dv-heart">💜</span>
    <span className="text-4xl dv-glow">✨</span>
    <span className="text-6xl dv-heart" style={{ animationDelay: ".7s" }}>💕</span>
    <div className="absolute bottom-8 w-40 h-1 bg-gradient-to-r from-transparent via-pink-500/70 to-transparent rounded-full dv-glow" />
  </div>
);

// 🔮 Хрустальный шар
const CrystalBallAnimation = () => (
  <div className="relative h-52 flex items-center justify-center overflow-hidden">
    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/30 via-purple-700/40 to-indigo-900/60 border border-violet-300/40 shadow-2xl shadow-violet-700/40">
      <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-transparent via-violet-300/20 to-white/30 blur-sm dv-float" />
      <div className="absolute top-4 left-6 w-6 h-6 rounded-full bg-white/50 blur-md dv-glow" />
      <div className="absolute inset-0 flex items-center justify-center text-5xl dv-bounce">🔮</div>
      <div className="absolute -inset-3 rounded-full border border-violet-400/20 dv-spin" style={{ animationDuration: "7s" }} />
    </div>
  </div>
);

// ⭐ Звёзды и орбиты
const StarsAnimation = () => {
  const stars = [
    { x: 10, y: 20, d: 0, s: 6 }, { x: 25, y: 70, d: .4, s: 4 }, { x: 40, y: 15, d: .8, s: 5 },
    { x: 60, y: 80, d: 1.2, s: 4 }, { x: 75, y: 25, d: .2, s: 6 }, { x: 88, y: 60, d: .9, s: 5 },
    { x: 15, y: 45, d: 1.5, s: 3 }, { x: 50, y: 40, d: .6, s: 3 }, { x: 82, y: 85, d: 1.1, s: 4 },
    { x: 33, y: 88, d: .3, s: 5 },
  ];
  return (
    <div className="relative h-52 overflow-hidden flex items-center justify-center">
      {stars.map((st, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-yellow-200 dv-twinkle"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            animationDelay: `${st.d}s`,
            boxShadow: "0 0 10px rgba(253,224,71,.9)",
          }}
        />
      ))}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 border border-yellow-300/25 rounded-full dv-spin" style={{ animationDuration: "9s" }} />
        <div className="absolute w-32 h-32 border border-yellow-300/35 rounded-full dv-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
        <span className="text-5xl dv-bounce">⭐</span>
      </div>
    </div>
  );
};

// ☕ Кофейная гуща
const CoffeeAnimation = () => (
  <div className="relative h-52 flex items-center justify-center overflow-hidden">
    <div className="relative">
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-8 bg-gradient-to-t from-amber-200/50 to-transparent rounded-full dv-steam" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>
      <div className="text-7xl dv-wobble">☕</div>
      <div className="flex gap-3 justify-center mt-3">
        {["●", "◐", "○", "◑", "●"].map((sym, i) => (
          <span key={i} className="text-amber-500/80 dv-fadein text-sm" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>{sym}</span>
        ))}
      </div>
    </div>
  </div>
);

// ᚱ Руны — падают и оседают
const RunesAnimation = () => {
  const runes = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"];
  return (
    <div className="relative h-52 overflow-hidden flex items-center justify-center">
      {runes.map((r, i) => (
        <span
          key={i}
          className="absolute text-2xl text-violet-300/80 dv-rune"
          style={{ left: `${6 + i * 8}%`, animationDelay: `${(i * 0.35) % 3}s`, animationDuration: `${2.5 + (i % 3) * 0.7}s` }}
        >
          {r}
        </span>
      ))}
      <div className="relative w-24 h-24 rounded-full border-2 border-violet-400/40 bg-violet-900/20 flex items-center justify-center dv-glow">
        <span className="text-4xl text-violet-200">ᚱ</span>
      </div>
    </div>
  );
};

const GenericAnimation = ({ emoji }: { emoji: string }) => (
  <div className="h-52 flex items-center justify-center">
    <span className="text-7xl dv-bounce">{emoji}</span>
  </div>
);

export default function DivinationAnimation({ type, emoji }: Props) {
  const [message, setMessage] = useState("Магия пробуждается...");

  useEffect(() => {
    const messages = [
      "Магия пробуждается...",
      "Символы складываются в послание...",
      "Оракул считывает энергии...",
      "Потоки будущего раскрываются...",
      "Тайны становятся явными...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setMessage(messages[i]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const getAnimation = () => {
    switch (type) {
      case "celtic-cross": return <CelticCrossAnimation />;
      case "tarot-love": return <LoveAnimation />;
      case "tarot-future": return <CrystalBallAnimation />;
      case "tarot-birthdate": return <StarsAnimation />;
      case "coffee-grounds": return <CoffeeAnimation />;
      case "runes": return <RunesAnimation />;
      case "tarot-yes-no": return <TarotAnimation />;
      default: return <GenericAnimation emoji={emoji} />;
    }
  };

  return (
    <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-indigo-900/30 border border-violet-500/30 shadow-2xl shadow-violet-900/50">
      <style>{CSS}</style>
      {getAnimation()}
      <div className="mt-4 text-center">
        <p className="text-violet-200 text-lg font-medium dv-glow">{message}</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-400 dv-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
