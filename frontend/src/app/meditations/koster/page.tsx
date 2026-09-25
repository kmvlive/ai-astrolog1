"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoScene from "@/components/VideoScene";

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
  const [duration, setDuration] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meditation_duration");
      return saved ? parseInt(saved) : 600; // 10 минут по умолчанию
    }
    return 600;
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Сохраняем громкость и длительность
  useEffect(() => {
    localStorage.setItem("meditation_volume", String(volume));
    localStorage.setItem("meditation_duration", String(duration));
  }, [volume, duration]);

  // Таймер сессии
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
    setAudioStarted(true);
    setTimeLeft(duration);
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
    <div className="min-h-screen bg-black text-white">
      {/* Видео фон */}
      {audioStarted && <VideoScene slug="koster" volume={volume} />}

      {/* Оверлей UI */}
      <div className="relative z-30 min-h-screen flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-sm">
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Длительность: {Math.floor(duration / 60)} мин
                  </label>
                  <input
                    type="range"
                    min="120"
                    max="1800"
                    step="60"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={startSession}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 transition text-lg font-bold"
                >
                  ▶ Начать медитацию
                </button>
              </div>
            </div>
          )}

          {audioStarted && !finished && (
            <div className="absolute bottom-24 left-0 right-0 px-4 space-y-4">
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
