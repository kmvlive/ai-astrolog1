"use client";

import { useEffect, useRef, useState } from "react";
import { projectEarth } from "@/lib/earthProjection";

export default function EarthScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [earthImg, setEarthImg] = useState<HTMLImageElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const starsRef = useRef<{x: number; y: number; r: number; alpha: number; speed: number; phase: number; vx: number; vy: number;}[]>([]);
  const cometsRef = useRef<{x: number; y: number; vx: number; vy: number; alpha: number;}[]>([]);
  const nextCometTimeRef = useRef(8);
  const projCacheRef = useRef<HTMLCanvasElement | null>(null);
  const lastRotRef = useRef(0);

  useEffect(() => {
    if (starsRef.current.length === 0) {
      for (let i = 0; i < 500; i++) {
        starsRef.current.push({
          x: Math.random(), y: Math.random(),
          r: 0.3 + Math.random() * 1.2,
          alpha: 0.3 + Math.random() * 0.7,
          speed: 0.5 + Math.random() * 2.0,
          phase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.0005,
          vy: (Math.random() - 0.5) * 0.0005
        });
      }
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/storage/space/earth_night.jpg?v=" + Date.now();
    img.onload = () => setEarthImg(img);
    img.onerror = () => setUseFallback(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dt = 0.016;
      const base = Math.min(w, h);
      
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      for (const star of starsRef.current) {
        star.x += star.vx * dt;
        star.y += star.vy * dt;
        if (star.x < 0) star.x = 1; if (star.x > 1) star.x = 0;
        if (star.y < 0) star.y = 1; if (star.y > 1) star.y = 0;
        
        const twinkle = 0.6 + 0.4 * Math.sin(time * star.speed + star.phase);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }



      // Земля
      const R = base * 0.40; // весь глобус в кадре с воздухом вокруг
      const cx = w * 0.5;
      const cy = h * 0.5;
      const surfaceRot = time * 0.005;

      // Адаптивное внешнее свечение (ореол снаружи диска)
      const isMobile = w < 768;
      const glowA = isMobile ? 0.22 : 0.40;
      const glowReach = isMobile ? 1.06 : 1.12;
      const halo = ctx.createRadialGradient(cx, cy, R * 0.99, cx, cy, R * glowReach);
      halo.addColorStop(0, `rgba(100,180,255,${glowA})`);
      halo.addColorStop(0.5, `rgba(80,150,255,${glowA * 0.35})`);
      halo.addColorStop(1, "rgba(60,120,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * glowReach, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      if (earthImg && !useFallback) {
        const S = Math.min(2048, Math.max(1024, Math.round((R * 2) / 128) * 128));
        const proj = projectEarth(earthImg, surfaceRot + 0.35, S, 0.6);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.18); // лёгкий наклон оси — вид как с орбиты
        ctx.drawImage(proj, -R, -R, R * 2, R * 2);
        ctx.restore();
      } else {
        const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
        grad.addColorStop(0, "#1a4d8f");
        grad.addColorStop(0.5, "#0d2b5e");
        grad.addColorStop(1, "#051530");
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

      time += dt;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [earthImg, useFallback]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
