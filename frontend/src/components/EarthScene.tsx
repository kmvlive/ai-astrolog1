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

      nextCometTimeRef.current -= dt;
      if (nextCometTimeRef.current <= 0) {
        nextCometTimeRef.current = 8 + Math.random() * 10;
        
        // БЫСТРЫЕ КОМЕТЫ ЧЕРЕЗ ЦЕНТР ЭКРАНА
        const side = Math.floor(Math.random() * 4);
        let x = 0, y = 0, vx = 0, vy = 0;
        const speed = 1.2 + Math.random() * 0.8; // ОЧЕНЬ БЫСТРО: 1.2-2.0 экрана/сек
        
        if (side === 0) { // Слева направо через центр
          x = -0.1; y = 0.3 + Math.random() * 0.4; // y: 0.3-0.7 (центр)
          vx = speed; vy = (Math.random() - 0.5) * 0.2; // Почти горизонтально
        } else if (side === 1) { // Справа налево через центр
          x = 1.1; y = 0.3 + Math.random() * 0.4;
          vx = -speed; vy = (Math.random() - 0.5) * 0.2;
        } else if (side === 2) { // Сверху вниз
          x = 0.3 + Math.random() * 0.4; y = -0.1;
          vx = (Math.random() - 0.5) * 0.2; vy = speed;
        } else { // Снизу вверх
          x = 0.3 + Math.random() * 0.4; y = 1.1;
          vx = (Math.random() - 0.5) * 0.2; vy = -speed;
        }
        
        cometsRef.current.push({ x, y, vx, vy, alpha: 1.0 });
      }

      cometsRef.current = cometsRef.current.filter(comet => {
        comet.x += comet.vx * dt;
        comet.y += comet.vy * dt;
        comet.alpha -= dt * 0.1;

        if (comet.x < -0.5 || comet.x > 1.5 || comet.y < -0.5 || comet.y > 1.5 || comet.alpha <= 0) {
          return false;
        }
        
        // ОЧЕНЬ ДЛИННЫЙ ЯРКИЙ ХВОСТ
        const tailX = comet.x - comet.vx * 0.8;
        const tailY = comet.y - comet.vy * 0.8;
        
        const gradient = ctx.createLinearGradient(comet.x * w, comet.y * h, tailX * w, tailY * h);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${comet.alpha})`);
        gradient.addColorStop(0.3, `rgba(180, 220, 255, ${comet.alpha * 0.9})`);
        gradient.addColorStop(1, "rgba(100, 150, 255, 0)");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(comet.x * w, comet.y * h);
        ctx.lineTo(tailX * w, tailY * h);
        ctx.stroke();
        
        // Яркая голова со свечением
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(200, 230, 255, 1.0)";
        ctx.fillStyle = `rgba(255, 255, 255, ${comet.alpha})`;
        ctx.beginPath();
        ctx.arc(comet.x * w, comet.y * h, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        return true;
      });

      // Земля
      const R = base * 0.48; // весь глобус в кадре
      const cx = w * 0.5;
      const cy = h * 0.5;
      const surfaceRot = time * 0.005;

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

      const rim = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.05);
      rim.addColorStop(0, "rgba(90,160,255,0)");
      rim.addColorStop(0.5, "rgba(90,160,255,0.25)");
      rim.addColorStop(1, "rgba(90,160,255,0)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.fill();

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
