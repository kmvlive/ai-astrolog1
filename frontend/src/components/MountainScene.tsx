"use client";

import { useEffect, useRef } from "react";
import { fbm } from "@/lib/noise";
import { CometSystem } from "@/lib/scenePaint";

interface Props {
  moonPhase?: number; // 0-7
}

export default function MountainScene({ moonPhase = 4 }: Props) {
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
      ctx.clearRect(0, 0, w, h);

      // Звёзды
      const poleX = w * 0.5;
      const poleY = -h * 0.4;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 150; i++) {
        const baseAngle = (i * 137.508) % 360;
        const radius = 150 + ((i * 7.31) % (h * 0.9));
        const angle = ((baseAngle + time * 0.5) * Math.PI) / 180;
        const x = poleX + Math.cos(angle) * radius;
        const y = poleY + Math.sin(angle) * radius;
        if (y > 0 && y < h * 0.8) {
          const r = 0.5 + (i % 3) * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ЛУНА: дышащее halo + настоящая текстура фазы
      const moonX = w * 0.75;
      const moonY = h * 0.22;
      const moonR = 32;
      const breathe = 0.85 + Math.sin(time * 0.4) * 0.15;

      // Ореол (3 слоя мягкого свечения)
      const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 4.2);
      halo.addColorStop(0, `rgba(255, 250, 220, ${0.20 * breathe})`);
      halo.addColorStop(0.35, `rgba(200, 220, 255, ${0.08 * breathe})`);
      halo.addColorStop(1, "rgba(200, 220, 255, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 4.2, 0, Math.PI * 2);
      ctx.fill();

      // Диск: процедурная луна с настоящим терминатором
      const phase01 = ((moonPhase % 8) + 8) % 8 / 8; // 0..1
      const waxing = phase01 < 0.5;                  // растущая = свет справа
      const k = Math.cos(phase01 * 2 * Math.PI);     // 1=new, -1=full
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.clip();
      // Тёмная сторона (earthshine)
      ctx.fillStyle = "rgb(24,28,42)";
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
      // Освещённая половина
      ctx.fillStyle = "rgb(245,243,231)";
      ctx.beginPath();
      if (waxing) ctx.arc(moonX, moonY, moonR, -Math.PI / 2, Math.PI / 2, false);
      else ctx.arc(moonX, moonY, moonR, Math.PI / 2, Math.PI * 1.5, false);
      ctx.closePath();
      ctx.fill();
      // Терминатор (граница света и тени)
      ctx.beginPath();
      ctx.ellipse(moonX, moonY, Math.abs(k) * moonR, moonR, 0, 0, Math.PI * 2);
      ctx.fillStyle = k > 0 ? "rgb(24,28,42)" : "rgb(245,243,231)";
      ctx.fill();
      // Кратеры (детерминированные)
      ctx.fillStyle = "rgba(140,140,128,0.28)";
      [
        [-0.30, -0.20, 0.18], [0.25, 0.10, 0.12], [-0.10, 0.35, 0.14],
        [0.35, -0.30, 0.09], [-0.45, 0.15, 0.10], [0.05, -0.45, 0.07],
      ].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(moonX + dx * moonR, moonY + dy * moonR, r * moonR, 0, Math.PI * 2);
        ctx.fill();
      });
      // Limb darkening: край диска темнее (объём)
      const limb = ctx.createRadialGradient(
        moonX - moonR * 0.25, moonY - moonR * 0.25, moonR * 0.2,
        moonX, moonY, moonR
      );
      limb.addColorStop(0, "rgba(0,0,0,0)");
      limb.addColorStop(0.75, "rgba(0,0,0,0.05)");
      limb.addColorStop(1, "rgba(0,0,0,0.30)");
      ctx.fillStyle = limb;
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
      ctx.restore();

      // Кометы
      cometSys.update(ctx, w, h, time, dt);

      // Горы (непрозрачные)
      const layers = [
        { y: h * 0.75, color: "rgb(35,45,70)",  amp: 80,  freq: 0.003 },
        { y: h * 0.82, color: "rgb(22,30,52)",  amp: 100, freq: 0.005 },
        { y: h * 0.88, color: "rgb(10,15,30)",  amp: 120, freq: 0.008 },
      ];
      layers.forEach((layer) => {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 4) {
          const ny = layer.y + fbm(x * layer.freq) * layer.amp;
          ctx.lineTo(x, ny);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      });

      // Туман
      const fog = ctx.createLinearGradient(0, h * 0.85, 0, h);
      fog.addColorStop(0, "rgba(100,120,150,0)");
      fog.addColorStop(0.5, "rgba(100,120,150,0.25)");
      fog.addColorStop(1, "rgba(100,120,150,0.5)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

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
