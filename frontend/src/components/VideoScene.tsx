"use client";

import { useEffect, useRef, useState } from "react";

interface VideoSceneProps {
  slug: string;
  volume: number;
  onEnded?: () => void;
}

export default function VideoScene({ slug, volume, onEnded }: VideoSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Загружаем signed URL
  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch(`/api/video-url/${slug}`);
        if (!res.ok) throw new Error("Failed to get video URL");
        const data = await res.json();
        setVideoUrl(data.url);
      } catch (err) {
        setError("Не удалось загрузить видео");
        console.error("[VideoScene] fetch error:", err);
      }
    };
    fetchUrl();
  }, [slug]);

  // Применяем громкость к видео и запускаем play
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      // Явно запускаем play если ещё не играет
      const playPromise = videoRef.current.play();
      if (playPromise) {
        playPromise.catch((err) => {
          console.warn("[VideoScene] play failed:", err);
        });
      }
    }
  }, [volume, videoUrl]);

  // Блокируем контекстное меню на видео
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Блокируем drag
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

  if (!videoUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Загрузка видео...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Блюр по бокам на десктопе (вертикальное видео не на весь экран) */}
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
        src={videoUrl}
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

      {/* Прозрачный оверлей поверх видео — блокирует правый клик и скачивание */}
      <div
        className="absolute inset-0 z-20"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      />
    </div>
  );
}
