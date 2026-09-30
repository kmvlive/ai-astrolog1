"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { AudioEngine } from "@/lib/AudioEngine";
import MountainScene from "@/components/MountainScene";
import SeaScene from "@/components/SeaScene";
import SpaceScene from "@/components/SpaceScene";
import EarthScene from "@/components/EarthScene";
import GalaxyScene from "@/components/GalaxyScene";
import StarflightScene from "@/components/StarflightScene";
import RainScene from "@/components/RainScene";
import MatrixScene from "@/components/MatrixScene";
import CodeScene from "@/components/CodeScene";
import MandalaScene from "@/components/MandalaScene";
import SacredGeometryScene from "@/components/SacredGeometryScene";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const NAMES: Record<string, { name: string; emoji: string }> = {
  mountains: { name: "Ночь в горах", emoji: "🏔️" },
  sea: { name: "Ночь на море", emoji: "" },
  space: { name: "Полёт в корабле", emoji: "" },
  earth: { name: "Земля из космоса", emoji: "" },
  galaxy: { name: "Галактика", emoji: "🌌" },
  starflight: { name: "Полёт сквозь звёзды", emoji: "💫" },
  rain: { name: "Дождь за окном", emoji: "🌧️" },
  matrix: { name: "Матрица", emoji: "💊" },
  code: { name: "Успокаивающий код", emoji: "💻" },
  mandala: { name: "Мандала", emoji: "☸️" },
  sacred: { name: "Сакральная геометрия", emoji: "🕉️" },
};

function moonPhaseIndex(d: Date): number {
  const synodic = 29.53058867;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const days = (d.getTime() - ref) / 86400000;
  const phase = (((days % synodic) + synodic) % synodic) / synodic;
  return Math.floor(phase * 8 + 0.5) % 8;
}

function Player() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const slug = String(params.slug || "mountains");
  const dur = Number(sp.get("dur") || 10);
  const soundParam = sp.get("sound") !== "0";
  const [sound, setSound] = useState(soundParam);
  const moon = sp.get("moon") !== "0";

  const [left, setLeft] = useState(dur > 0 ? dur * 60 : -1);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<AudioEngine | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meditation_volume");
      return saved ? parseFloat(saved) : 0.35;
    }
    return 0.65;
  }); // Начальная громкость
  const hideTimer = useRef<number | null>(null);

  const poke = () => {
    setUiVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setUiVisible(false), 4000);
  };

  useEffect(() => {
    poke();
    const events = ["mousemove", "touchstart", "keydown", "click"] as const;
    events.forEach((e) => window.addEventListener(e, poke));
    return () => {
      events.forEach((e) => window.removeEventListener(e, poke));
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const startAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new AudioEngine();
    }
    const audioScene = (slug === "galaxy" || slug === "starflight" || slug === "matrix" || slug === "code" || slug === "mandala" || slug === "sacred" ? "space" : slug) as "mountains" | "sea" | "space" | "rain";
    await audioRef.current.start(audioScene, volume);
    audioRef.current.setVolume(volume); // гарантированно ставим громкость сессии
    setAudioStarted(true);
  };

  // Обновляем громкость при изменении ползунка
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Сохраняем в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("meditation_volume", newVolume.toString());
    }
    
    // Применяем к аудио движку
    if (audioRef.current) {
      audioRef.current.setVolume(newVolume);
    }
  };

  // Автозапуск звука если включён
  useEffect(() => {
    if (sound && !audioStarted) {
      startAudio().catch((err) => {
        console.warn("Автозапуск звука не удался (требует user gesture):", err);
      });
    }
  }, [sound]);

  useEffect(() => {
    return () => {
      audioRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (left < 0 || finished) return;
    if (left === 0) { setFinished(true); return; }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, finished]);

  // Авто-возврат через 5 секунд после завершения
  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => {
      router.push("/meditations");
    }, 5000);
    return () => clearTimeout(timer);
  }, [finished, router]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const meta = NAMES[slug] || { name: slug, emoji: "🧘" };

  return (
    <div className={`fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center overflow-hidden ${uiVisible ? "" : "cursor-none"}`}>
      {slug === "mountains" ? (
        <MountainScene moonPhase={moon ? moonPhaseIndex(new Date()) : 4} />
      ) : slug === "sea" ? (
        <SeaScene moonPhase={moon ? moonPhaseIndex(new Date()) : 4} />
      ) : slug === "space" ? (
        <SpaceScene moonPhase={moon ? moonPhaseIndex(new Date()) : 4} />
      ) : slug === "earth" ? (
        <EarthScene moon={moon} />
      ) : slug === "galaxy" ? (
        <GalaxyScene />
      ) : slug === "starflight" ? (
        <StarflightScene />
      ) : slug === "rain" ? (
        <RainScene />
      ) : slug === "matrix" ? (
        <MatrixScene />
      ) : slug === "code" ? (
        <CodeScene />
      ) : slug === "mandala" ? (
        <MandalaScene />
      ) : slug === "sacred" ? (
        <SacredGeometryScene />
      ) : (
        <div className="star-layer" aria-hidden="true" />
      )}
      <div className={`relative z-10 text-center px-6 transition-opacity duration-700 ${uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="text-5xl mb-4">{meta.emoji}</div>
        <h1 className="text-2xl font-bold mb-2">{meta.name}</h1>
        <p className="text-slate-400 mb-8 text-sm">
          {dur > 0 ? `Сессия ${dur} мин` : "Без ограничений"}
          {sound ? " · со звуком" : " · тихо"}
          {moon ? " · по фазе луны" : ""}
        </p>

        {finished ? (
          <div>
            <p className="text-emerald-300 text-lg mb-6">✨ Сессия завершена. Как вы себя чувствуете?</p>
            <p className="text-slate-400 text-sm mb-4">Автоматический возврат через 5 секунд...</p>
            <button onClick={() => router.push("/meditations")} className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition">
              К списку медитаций
            </button>
          </div>
        ) : (
          <>
            <div className="text-6xl font-extrabold tabular-nums mb-8 text-white/90">{left >= 0 ? fmt(left) : "∞"}</div>
            {!sound && !finished && (
              <button
                onClick={() => setSound(true)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition mb-4 text-sm"
              >
                🔇 Звук выключен — включить
              </button>
            )}
            {sound && !audioStarted && (
              <button
                onClick={startAudio}
                className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold transition mb-4 text-lg"
              >
                🔊 Включить звук
              </button>
            )}
            {sound && audioStarted && (
              <div className="mb-4">
                <div className="text-emerald-300 text-sm mb-2">🔊 Звук играет</div>
                {/* Ползунок громкости */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-slate-400 text-xs">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-48 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-slate-400 text-xs">🔊</span>
                </div>
              </div>
            )}
            <button onClick={() => router.push("/meditations")} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition">
              Завершить сессию
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-slate-950" />}>
      <Player />
    </Suspense>
  );
}
