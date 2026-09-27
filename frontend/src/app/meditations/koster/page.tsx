"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoScene from "@/components/VideoScene";
import { useAutoHideUI } from "@/hooks/useAutoHideUI";

const DURATIONS = [
  { v: 5,  label: "5 мин" },
  { v: 10, label: "10 мин" },
  { v: 15, label: "15 мин" },
  { v: 20, label: "20 мин" },
  { v: 0,  label: "Без лимита" },
];

export default function KosterMeditation() {
  const router = useRouter();
  const [audioStarted, setAudioStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meditation_volume");
      const v = saved ? parseFloat(saved) : 0.35;
      return isNaN(v) ? 0.35 : v;
    }
    return 0.35;
  });
  const [duration, setDuration] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meditation_duration_koster");
      if (saved !== null && saved !== "") return parseInt(saved, 10);
    }
    return 10; // 10 минут по умолчанию — всегда что-то выбрано
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Immersive: UI автоскрывается после старта медитации
  const { isVisible } = useAutoHideUI({
    delay: 3000,
    enabled: audioStarted && !finished,
  });

  // Сохраняем громкость и длительность
  useEffect(() => {
    localStorage.setItem("meditation_volume", String(volume));
    localStorage.setItem("meditation_duration_koster", String(duration));
  }, [volume, duration]);

  // Таймер сессии (только если не "без лимита")
  useEffect(() => {
    if (audioStarted && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => (t !== null ? t - 1 : null));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [audioStarted, timeLeft]);

  // Завершение сессии
  useEffect(() => {
    if (timeLeft === 0 && audioStarted) {
      setFinished(true);
      setTimeout(() => {
        router.push("/meditations");
      }, 5000);
    }
  }, [timeLeft, audioStarted, router]);

  const startSession = () => {
    if (duration === null) return; // Защита: нельзя запустить без выбора
    setAudioStarted(true);
    // 0 = без лимита → таймер не запускается
    setTimeLeft(duration === 0 ? null : duration * 60);
  };

  const stopSession = () => {
    setAudioStarted(false);
    setTimeLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{ cursor: (audioStarted && !finished && !isVisible) ? "none" : "auto" }}
    >
      {audioStarted && <VideoScene slug="koster" volume={volume} uiVisible={isVisible} />}

      <div className="relative z-30 min-h-screen flex flex-col">
        {/* Шапка — плавное появление/исчезновение */}
        <div 
          className={`flex items-center justify-between p-4 bg-black/40 backdrop-blur-sm transition-all duration-500 ${
            isVisible 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={() => router.push("/meditations")}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
          >
            ← Назад
          </button>
          <div className="text-center">
            <div className="text-lg font-bold">🔥 Ночной костёр</div>
            {timeLeft !== null && (
              <div className="text-sm text-slate-300">
                {formatTime(timeLeft)}
              </div>
            )}
            {audioStarted && duration === 0 && (
              <div className="text-sm text-slate-300">∞ Без лимита</div>
            )}
          </div>
          <div className="w-20" />
        </div>

        {/* Центр */}
        <div className="flex-1 flex items-center justify-center">
          {!audioStarted && (
            <div className="text-center space-y-6 p-8">
              <div className="text-6xl">🔥</div>
              <h1 className="text-3xl font-bold">Ночной костёр</h1>
              <p className="text-slate-300 max-w-md">
                Звуки ночного костра для глубокой медитации и спокойного сна
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-3">
                    Длительность
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {DURATIONS.map((d) => {
                      const isDefault = duration === null && d.v === 10;
                      const isSelected = duration === d.v;
                      return (
                        <button
                          key={d.v}
                          onClick={() => setDuration(d.v)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                            isSelected
                              ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/30"
                              : isDefault
                              ? "bg-amber-500/10 border-amber-400 border-dashed text-amber-200 hover:bg-amber-500/20"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {d.label}
                          {isDefault && <span className="ml-1 text-xs opacity-70">•</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={startSession}
                  disabled={duration === null}
                  className={`px-8 py-4 rounded-xl transition text-lg font-bold shadow-lg ${
                    duration === null
                      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 shadow-amber-500/30"
                  }`}
                >
                  {duration === null ? "Выберите длительность" : `▶ Начать (${duration === 0 ? "∞" : duration + " мин"})`}
                </button>
              </div>
            </div>
          )}

          {audioStarted && !finished && (
            <div 
              className={`absolute bottom-24 left-0 right-0 px-4 space-y-4 transition-all duration-500 ${
                isVisible 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  🔊 Громкость: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="text-center">
                <button
                  onClick={stopSession}
                  className="px-6 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 transition text-sm font-semibold"
                >
                  ⏹ Завершить
                </button>
              </div>
            </div>
          )}

          {finished && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🌙</div>
              <h2 className="text-2xl font-bold">Сессия завершена</h2>
              <p className="text-slate-300">Возврат через 5 секунд...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
