"use client";

import { useEffect, useRef, useState } from "react";
import { projectEarth } from "@/lib/earthProjection";

// Детерминированный псевдослучайный номер из целого (для фаз сияния)
function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Позиция подсолнечной точки из реальной даты/времени
function sunPos(d: Date) {
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
    img.src = "/storage/space/earth_night.jpg?v=2";
    img.onload = () => setEarthImg(img);
    img.onerror = () => setUseFallback(true);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/storage/space/earth_day.jpg?v=2";
    img.onload = () => setDayImg(img);
    img.onerror = () => setDayImg(null);
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



      // Позиция солнца в реальном времени (для терминатора)
      const surfaceRot = time * 0.005;
      const sunReal = moon ? sunPos(new Date()) : null;
      // Солнце фиксировано в пространстве камеры: терминатор НЕ едет за вращением,
      // а стоит на месте (как на снимках с солнечно-синхронных орбит),
      // континенты вращаются внутри света/тени. Позиция тени — по реальному времени.
      const sun = sunReal ? { decl: sunReal.decl, lonSub: sunReal.lonSub + surfaceRot } : null;

      // Земля
      const R = base * 0.40; // весь глобус в кадре с воздухом вокруг
      const cx = w * 0.5;
      const cy = h * 0.5;
      

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
        const a = glowBase * 0.3 * (0.2 + 0.8 * pulse) * breathe; // блики в 2 раза тусклее
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
        const S = Math.min(2048, Math.max(1024, Math.round((R * 2) / 128) * 128));
        const proj = projectEarth(earthImg, surfaceRot + 0.35, S, 0.45, { dayTex: dayImg, sun, nightDim: 0.3 }) // центр ~26N: полюс к кромке, больше огней в кадре;
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

      // Полярное сияние: мягкие волнистые занавесы над полярной зоной
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";
      const poleY = cy - R * 0.90; // полюс у верхней кромки (центр проекции 26N)
      const auroraScale = isMobile ? 0.6 : 1.0;
      // Сияние живёт вспышками: медленно разгорается, волнится, медленно гаснет;
      // циклы ~150 сек со случайной длительностью, иногда сияния нет вовсе
      const cycle = 300; // 5-минутный цикл: 1-2 вспышки на 10-минутную сессию
      const idx = Math.floor(time / cycle);
      const frac = time / cycle - idx;
      const r1 = hash01(idx), r2 = hash01(idx * 7 + 3);
      const skip = hash01(idx * 13 + 5) < 0.22;
      const active = 0.25 + 0.25 * r1; // вспышка 75-150 сек, остальное - пауза
      let env = 0;
      if (!skip && frac < active) {
        const u = frac / active;
        env = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 1.4);
      }
      env *= 0.8 + 0.2 * Math.sin(time * 0.21 + r2 * 6.283); // волны внутри вспышки
      // Базовое полярное свечение-купол
      const dome = ctx.createRadialGradient(cx, poleY + R * 0.08, 0, cx, poleY + R * 0.08, R * 0.45);
      const domeA = 0.10 * auroraScale * (0.8 + 0.2 * Math.sin(time * 0.09)) * env;
      dome.addColorStop(0, `rgba(90,255,180,${domeA})`);
      dome.addColorStop(0.6, `rgba(70,200,160,${domeA * 0.4})`);
      dome.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = dome;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      for (let b = 0; b < 3; b++) {
        const baseY = poleY + R * (0.04 + b * 0.06); // ленты прижаты к шапке
        const thick = R * (0.10 + 0.02 * Math.sin(time * 0.11 + b));
        const hue = b === 2 ? "160,220,255" : b === 1 ? "110,255,190" : "80,255,160";
        const aBase = (0.16 - b * 0.035) * auroraScale * (0.75 + 0.25 * Math.sin(time * 0.17 + b * 2.1)) * env;
        const grad = ctx.createLinearGradient(0, baseY - thick, 0, baseY + thick * 1.6);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.35, `rgba(${hue},${aBase})`);
        grad.addColorStop(0.65, `rgba(${hue},${aBase * 0.8})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        const x0 = cx - R * 0.95, x1 = cx + R * 0.95;
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const xx = x0 + ((x1 - x0) * i) / steps;
          const ph = (xx - cx) / R;
          const yy = baseY
            + Math.sin(ph * 2.2 + time * (0.21 + b * 0.05) + b * 1.3) * R * 0.035
            + Math.sin(ph * 5.1 - time * 0.13 + b) * R * 0.015;
          if (i === 0) ctx.moveTo(xx, yy - thick);
          else ctx.lineTo(xx, yy - thick);
        }
        for (let i = steps; i >= 0; i--) {
          const xx = x0 + ((x1 - x0) * i) / steps;
          const ph = (xx - cx) / R;
          const yy = baseY
            + Math.sin(ph * 2.2 + time * (0.21 + b * 0.05) + b * 1.3) * R * 0.035
            + Math.sin(ph * 5.1 - time * 0.13 + b) * R * 0.015;
          ctx.lineTo(xx, yy + thick);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      time += dt;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [earthImg, useFallback, dayImg, moon]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
