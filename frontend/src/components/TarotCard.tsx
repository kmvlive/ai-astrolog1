"use client";
import { useState, useEffect } from "react";

interface Props {
  image?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  flipOnClick?: boolean;
  initialFlipped?: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function TarotCard({
  image,
  name,
  size = "md",
  flipOnClick = true,
  initialFlipped = false,
  className = "",
  showLabel = true,
}: Props) {
  const [flipped, setFlipped] = useState(initialFlipped);

  // Синхронизация с пропом (для stagger-переворота извне)
  useEffect(() => {
    setFlipped(initialFlipped);
  }, [initialFlipped]);

  const sizes = {
    sm: { w: 80, h: 120 },
    md: { w: 220, h: 330 },
    lg: { w: 280, h: 420 },
  }[size];

  const handleClick = () => {
    if (flipOnClick) setFlipped((v) => !v);
  };

  return (
    <div
      className={`tarot-card-wrapper ${className}`}
      style={{ width: sizes.w, height: sizes.h, perspective: "1000px" }}
      onClick={handleClick}
      role={flipOnClick ? "button" : undefined}
      tabIndex={flipOnClick ? 0 : undefined}
    >
      <div
        className="tarot-card-inner"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* ЛИЦО (картинка или заглушка) */}
        <div className="tarot-card-face tarot-card-front">
          {image ? (
            <>
              <img
                src={`/storage/${image}`}
                alt={name}
                className="tarot-card-img"
                draggable={false}
              />
              <div className="tarot-card-vignette" />
            </>
          ) : (
            <div className="tarot-card-placeholder">
              <span className="text-4xl text-violet-300/50">🎴</span>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-2">{name}</div>
            </div>
          )}
        </div>

        {/* РУБАШКА */}
        <div className="tarot-card-face tarot-card-back">
          <div className="tarot-back-frame">
            <div className="tarot-back-inner">
              <div className="tarot-back-star tarot-back-star-tl" />
              <div className="tarot-back-star tarot-back-star-tr" />
              <div className="tarot-back-star tarot-back-star-bl" />
              <div className="tarot-back-star tarot-back-star-br" />
              <div className="tarot-back-center">
                <div className="tarot-back-sun">✦</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLabel && !flipped && (
        <div className="tarot-card-label">{name}</div>
      )}
    </div>
  );
}
