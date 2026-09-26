"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoSceneProps {
  slug: string;
  volume: number;
  onEnded?: () => void;
  uiVisible?: boolean;
}

export default function VideoScene({ slug, volume, onEnded, uiVisible = true }: VideoSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [quality, setQuality] = useState<string>("auto");
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [levels, setLevels] = useState<{ height: number; bitrate: number; index: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  const videoUrl = `/storage/video/${slug}_hls/master.m3u8`;

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        capLevelToPlayerSize: true,
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("[HLS] manifest parsed, levels:", data.levels.length);
        setLevels(
          data.levels.map((l, idx) => ({ 
            height: l.height, 
            bitrate: l.bitrate,
            index: idx 
          }))
        );
        
        video.play().catch((err) => {
          console.warn("[VideoScene] play failed:", err);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        const newQuality = `${level.height}p`;
        setQuality(newQuality);
        setCurrentLevel(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("[HLS] fatal error:", data);
          setError("Ошибка воспроизведения");
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((err) => {
          console.warn("[VideoScene] play failed:", err);
        });
      });
    } else {
      setError("Ваш браузер не поддерживает HLS");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      if (levelIndex === -1) {
        setQuality("auto");
      } else {
        const level = hlsRef.current.levels[levelIndex];
        setQuality(`${level.height}p`);
      }
      setShowQualityMenu(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Блюр по бокам на десктопе */}
      <div className="absolute inset-0 hidden md:flex">
        <video
          src={videoUrl}
          muted
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover blur-3xl scale-150 opacity-40"
          aria-hidden="true"
        />
      </div>

      {/* Основное видео */}
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className="relative z-10 w-full h-full md:w-auto md:h-full md:max-h-screen object-contain"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      />

      {/* Кнопка качества + меню — правый верхний угол */}
      {levels.length > 0 && (
        <div 
          className={`absolute top-4 right-4 z-40 transition-all duration-500 ${
            uiVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          {/* Кнопка показывает текущее качество */}
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white backdrop-blur-md transition hover:scale-105"
            style={{ 
              background: "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(168,85,247,0.8))",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
            }}
            aria-label="Качество видео"
            title="Выбрать качество"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {quality === "auto" ? "Авто" : quality}
          </button>

          {/* Меню выбора качества — открывается вниз */}
          {showQualityMenu && (
            <div 
              className="absolute top-12 right-0 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl p-2 min-w-[180px]"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
            >
              <div className="text-xs text-slate-400 uppercase font-semibold px-3 py-1.5 border-b border-white/10 mb-1">
                Качество видео
              </div>
              <button
                onClick={() => handleQualityChange(-1)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${
                  currentLevel === -1 
                    ? "bg-violet-600/30 text-violet-200" 
                    : "text-white hover:bg-white/10"
                }`}
              >
                <span>Авто</span>
                {currentLevel === -1 && <span className="text-violet-300">✓</span>}
              </button>
              {levels.map((level) => (
                <button
                  key={level.index}
                  onClick={() => handleQualityChange(level.index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${
                    currentLevel === level.index 
                      ? "bg-violet-600/30 text-violet-200" 
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <span>{level.height}p</span>
                  <span className="text-xs text-slate-400">
                    {Math.round(level.bitrate / 1000)} kbps
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Прозрачный оверлей */}
      <div
        className="absolute inset-0 z-20"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      />
    </div>
  );
}
