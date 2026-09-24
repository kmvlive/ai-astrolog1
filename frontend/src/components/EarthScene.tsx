"use client";

import { useEffect, useRef, useState } from "react";
import { projectEarth, SunPos } from "@/lib/earthProjection";
import { drawStars, CometSystem, hash } from "@/lib/scenePaint";

// Позиция подсолнечной точки из реальной даты/времени
function sunPos(d: Date): SunPos {
  const rad = Math.PI / 180;
  const N = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
  const utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const decl = -23.44 * Math.cos(rad * (360 / 365) * (N + 10));
  const B = rad * (360 / 365) * (N - 81);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  let lonSub = -15 * (utcH - 12 + eot / 60);
  lonSub = ((lonSub + 180) % 360 + 360) % 360 - 180;
  return { decl: decl * rad, lonSub: lonSub * rad };
}

export default function EarthScene({ moon = true }: { moon?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [earthImg, setEarthImg] = useState<HTMLImageElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [dayImg, setDayImg] = useState<HTMLImageElement | null>(null);

  const starsRef = useRef<{x: number; y: number; r: number; alpha: number; speed: number; phase: number; vx: number; vy: number;}[]>([]);
  const cometsRef = useRef<{x: number; y: number; vx: number; vy: number; alpha: number;}[]>([]);
  const lastCometTimeRef = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/storage/space/earth_night.jpg?v=" + Date.now();
    img.onload = () => setEarthImg(img);
    img.onerror = () => setUseFallback(true);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/storage/space/earth_day.jpg?v=" + Date.now();
    img.onload = () => setDayImg(img);
    img.onerror = () => setDayImg(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();

    const draw = () => {
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      const time = (performance.now() - start) / 1000;

      // Позиция солнца в реальном времени (для терминатора)
      const sun = moon ? sunPos(new Date()) : null;

      // Земля
      const R = base * 0.40; // весь глобус в кадре с воздухом вокруг
      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // Звёзды
      drawStars(ctx, w, h, time, starsRef);

      // Кома
      CometSystem.update(time, cometsRef, lastCometTimeRef);
      CometSystem.draw(ctx, w, h, cometsRef);

      // Адаптивное внешнее свечение (ореол снаружи диска)
      const isMobile = w < 768;
      const glowBase = isMobile ? 0.11 : 0.40;
      const reachBase = isMobile ? 1.03 : 1.12;

      // Мягкое "дыхание" ореола (~20 сек период)
      const breathe = 0.85 + 0.15 * Math.sin(time * 0.35);
      const glowA = glowBase * breathe;
      const glowReach = reachBase * (1 + 0.015 * Math.sin(time * 0.22 + 1.3));

      const halo = ctx.createRadialGradient(cx, cy, R * 0.99, cx, cy, R * glowReach);
      halo.addColorStop(0, `rgba(100,180,255,${glowA})`);
      halo.addColorStop(0.5, `rgba(80,150,255,${glowA * 0.35})`);
      halo.addColorStop(1, "rgba(60,120,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * glowReach, 0, Math.PI * 2);
      ctx.fill();

      // Пульсирующие блики по кромке: 3 направления дрейфуют и дышат независимо
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        const ang = i * 2.094 + time * (0.05 + i * 0.017) + Math.sin(time * 0.11 + i * 2.1) * 0.6;
        const pulse = 0.5 + 0.5 * Math.sin(time * (0.23 + i * 0.11) + i * 2.4);
        const a = glowBase * 0.3 * (0.2 + 0.8 * pulse) * breathe;
        const px = cx + Math.cos(ang) * R * 0.94;
        const py = cy + Math.sin(ang) * R * 0.94;
        const pr = R * (0.30 + 0.18 * pulse);
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, `rgba(110,180,255,${a})`);
        g.addColorStop(1, "rgba(110,180,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      if (earthImg && !useFallback) {
        const base = Math.min(w, h);
        const S = Math.min(2048, Math.max(1024, Math.round((R * 2) / 128) * 128));
        const proj = projectEarth(earthImg, surfaceRot + 0.35, S, 0.6, { dayTex: dayImg, sun, nightDim: 0.3 });
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.18); // лёгкий наклон оси — вид как с орбиты
        ctx.drawImage(proj, -R, -R, R * 2, R * 2);
        ctx.restore();
      } else {
        const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R);
        grad.addColorStop(0, "#1e40af");
        grad.addColorStop(0.5, "#1e3a8a");
        grad.addColorStop(1, "#0c1e3e");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      }

      ctx.restore();

      // Тонкая светящаяся кромка ПО КРАЮ ДИСКА (только 96-100% радиуса)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      const rimInner = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.0);
      rimInner.addColorStop(0, "rgba(120,200,255,0)");
      rimInner.addColorStop(0.7, `rgba(140,210,255,${isMobile ? 0.18 : 0.28})`);
      rimInner.addColorStop(1, `rgba(180,230,255,${isMobile ? 0.45 : 0.60})`);
      ctx.fillStyle = rimInner;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    const base = Math.min(window.innerWidth, window.innerHeight);
    const surfaceRot = time * 0.005;

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [earthImg, useFallback, dayImg, moon]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />;
}
