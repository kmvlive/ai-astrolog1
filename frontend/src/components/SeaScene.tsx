"use client";

import { useEffect, useRef } from "react";
import { drawStars, drawMoon, hash, CometSystem } from "@/lib/scenePaint";
import { fbm } from "@/lib/noise";

interface Props {
  moonPhase?: number;
}

export default function SeaScene({ moonPhase = 4 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let time = 0;
    const cometSys = new CometSystem();

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dt = 0.016;
      const horizon = h * 0.80;
      ctx.clearRect(0, 0, w, h);

      // Небо: звёзды до горизонта
      drawStars(ctx, w, h, time, horizon - 4);

      // Луна
      const moonX = w * 0.68;
      const moonY = h * 0.24;
      drawMoon(ctx, moonX, moonY, 32, ((moonPhase % 8) + 8) % 8 / 8, time);

      // Кометы (рисуются до моря — волны закрывают их у горизонта)
      cometSys.update(ctx, w, h, time, dt);

      // Море: базовый градиент
      const sea = ctx.createLinearGradient(0, horizon, 0, h);
      sea.addColorStop(0, "rgb(16,26,48)");
      sea.addColorStop(0.3, "rgb(10,18,36)");
      sea.addColorStop(1, "rgb(4,8,18)");
      ctx.fillStyle = sea;
      ctx.fillRect(0, horizon, w, h - horizon);

      // Лунная дорожка: мерцающие блики под луной
      for (let i = 0; i < 46; i++) {
        const t = i / 46;
        const y = horizon + 6 + t * (h - horizon - 10);
        const spread = 14 + t * 90;
        const jitter = (hash(i) - 0.5) * 2;
        const x = moonX + jitter * spread + Math.sin(time * 0.6 + i * 1.7) * spread * 0.35;
        const flick = 0.35 + 0.65 * Math.abs(Math.sin(time * (0.8 + hash(i + 99)) + i * 2.3));
        const len = (6 + hash(i + 7) * 22) * (0.5 + t);
        ctx.fillStyle = `rgba(255, 246, 214, ${(0.30 * flick * (1 - t * 0.55)).toFixed(3)})`;
        ctx.fillRect(x - len / 2, y, len, 1.6);
      }

      // Волны: 3 движущихся слоя
      const waveLayers = [
        { y: horizon + (h - horizon) * 0.18, amp: 3.5, freq: 0.011, speed: 0.55, color: "rgba(30,44,74,0.85)" },
        { y: horizon + (h - horizon) * 0.45, amp: 5.0, freq: 0.008, speed: 0.38, color: "rgba(18,30,56,0.92)" },
        { y: horizon + (h - horizon) * 0.75, amp: 7.0, freq: 0.006, speed: 0.26, color: "rgba(8,14,30,1)" },
      ];
      waveLayers.forEach((wl) => {
        ctx.fillStyle = wl.color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 5) {
          const y =
            wl.y +
            Math.sin(x * wl.freq + time * wl.speed * 2) * wl.amp +
            fbm(x * 0.004 + time * wl.speed * 0.35) * wl.amp * 1.6;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        // Гребни: светлая линия поверх волны
        ctx.strokeStyle = "rgba(180,200,235,0.10)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 5) {
          const y =
            wl.y +
            Math.sin(x * wl.freq + time * wl.speed * 2) * wl.amp +
            fbm(x * 0.004 + time * wl.speed * 0.35) * wl.amp * 1.6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      time += dt;
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [moonPhase]);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
