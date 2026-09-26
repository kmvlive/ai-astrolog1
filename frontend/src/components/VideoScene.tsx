"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoSceneProps {
  slug: string;
  volume: number;
  onEnded?: () => void;
}

export default function VideoScene({ slug, volume, onEnded }: VideoSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [quality, setQuality] = useState<string>("auto");
  const [levels, setLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoUrl = `/storage/video/${slug}_hls/master.m3u8`;

  // Инициализация HLS
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // auto
        capLevelToPlayerSize: true,
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("[HLS] manifest parsed, levels:", data.levels.length);
        setLevels(data.levels.map((l) => ({ height: l.height, bitrate: l.bitrate })));
        
        video.play().catch((err) => {
          console.warn("[VideoScene] play failed:", err);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        setQuality(`${level.height}p`);
        console.log(`[HLS] switched to ${level.height}p (${Math.round(level.bitrate / 1000)} kbps)`);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("[HLS] fatal error:", data);
          setError("Ошибка воспроизведения");
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari имеет нативную поддержку HLS
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

  // Применяем громкость
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Блокируем контекстное меню
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

      {/* Индикатор качества */}
      {quality !== "auto" && (
        <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-xs text-white">
          {quality}
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
