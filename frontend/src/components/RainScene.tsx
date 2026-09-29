"use client";

import { useEffect, useRef } from "react";
import { hash } from "@/lib/scenePaint";

interface Drop { x: number; y: number; r: number; vy: number; stick: number; wob: number; trail: number; }
interface Speck { x: number; y: number; r: number; a: number; }
interface Streak { x: number; y: number; len: number; v: number; a: number; }

export default function RainScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    let bg: HTMLImageElement | null = null;
    let specks: HTMLCanvasElement | null = null;
    let drops: Drop[] = [];
    let trailSpecks: Speck[] = [];
    let streaks: Streak[] = [];

    // Загрузка фона (твоя картинка)
    const urls = ["/storage/space/rain_window.jpg", "/storage/space/rain_window.png"];
    let ui = 0;
    const loadNext = () => {
      if (ui >= urls.length) { console.warn("[RainScene] фон не найден"); return; }
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => { bg = im; };
      im.onerror = () => { ui++; loadNext(); };
      im.src = urls[ui] + "?v=" + Date.now();
    };
    loadNext();

    // Зоны стёкол: исключаем подоконник и вертикальную раму
    const inGlass = (x: number, y: number) => {
      if (x < w * 0.02 || x > w * 0.96) return false;  // внешние боковые рамы (правая шире)
      if (y < h * 0.02) return false;                  // верхняя планка
      if (x > w * 0.68 && x < w * 0.80) return false;  // вертикальная стойка
      if (x <= w * 0.68 && y > h * 0.84) return false; // левый подоконник
      if (x >= w * 0.80 && y > h * 0.76) return false; // правый подоконник (выше из-за перспективы)
      if (x > w * 0.84 && y > h * 0.42) return false;  // цветок ВНУТРИ комнаты
      return true;
    };

    const randGlassX = () => {
      const left = Math.random() < 0.72;
      return left ? w * (0.03 + Math.random() * 0.63) : w * (0.82 + Math.random() * 0.13);
    };

    function buildSpecks() {
      specks = document.createElement("canvas");
      specks.width = w; specks.height = h;
      const g = specks.getContext("2d")!;
      const count = Math.round((w * h) / 4000);
      for (let i = 0; i < count; i++) {
        const x = hash(i * 1.31) * w;
        const y = hash(i * 2.77) * h * 0.80;
        if (!inGlass(x, y)) continue;
        const r = 0.4 + hash(i * 3.91) * 1.6;
        const a = 0.05 + hash(i * 5.17) * 0.22;
        g.fillStyle = `rgba(235, 242, 255, ${a})`;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        if (hash(i * 7.7) < 0.2) {
          g.fillStyle = `rgba(255, 255, 255, ${a * 0.9})`;
          g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2); g.fill();
        }
      }
    }

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      buildSpecks();
      streaks = Array.from({ length: 50 }, () => {
        const x = Math.random() < 0.72 ? Math.random() * w * 0.68 : w * (0.80 + Math.random() * 0.19);
        return {
          x,
          y: Math.random() * h * 0.8,
          len: 25 + Math.random() * 50,
          v: 400 + Math.random() * 400,
          a: 0.03 + Math.random() * 0.06,
        };
      });
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    let last = performance.now();

    const draw = () => {
      try {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Фон: твоя картинка (cover)
        ctx.fillStyle = "#10141a";
        ctx.fillRect(0, 0, w, h);
        if (bg) {
          const s = Math.max(w / bg.width, h / bg.height);
          const dw = bg.width * s, dh = bg.height * s;
          ctx.drawImage(bg, (w - dw) / 2, (h - dh) / 2, dw, dh);
        }

        // Дождь на улице: тонкие штрихи
        ctx.strokeStyle = "rgba(210, 225, 245, 1)";
        ctx.lineWidth = 1;
        for (const s of streaks) {
          s.y += s.v * dt;
          if (s.y > h * 0.82 || !inGlass(s.x, s.y)) { s.y = -s.len; s.x = randGlassX(); }
          ctx.globalAlpha = s.a;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.len * 0.05, s.y + s.len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Мелкая россыпь капель на стекле
        if (specks) ctx.drawImage(specks, 0, 0);

        // Тающие следы стекающих капель
        trailSpecks = trailSpecks.filter((t) => t.a > 0.01);
        for (const t of trailSpecks) {
          t.a -= dt * 0.035;
          ctx.fillStyle = `rgba(225, 238, 255, ${Math.max(0, t.a)})`;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
        }

        // Стекающие капли
        if (drops.length < 26 && Math.random() < dt * 2.5) {
          drops.push({
            x: randGlassX(),
            y: h * (0.04 + Math.random() * 0.45),
            r: 1.5 + Math.random() * 3.4,
            vy: 0,
            stick: 0.5 + Math.random() * 4,
            wob: Math.random() * Math.PI * 2,
            trail: 0,
          });
        }
        drops = drops.filter((d) => inGlass(d.x, d.y));
        for (const d of drops) {
          if (d.stick > 0) {
            // капля "прилипла" к стеклу — стоит
            d.stick -= dt;
            d.vy = 0;
          } else {
            // медленное скатывание с трением: скорость ограничена размером
            const vmax = 14 + d.r * 10;
            d.vy += (80 + d.r * 60) * dt;
            if (d.vy > vmax) d.vy = vmax;
            d.y += d.vy * dt;
            // виляние по стеклу
            d.x += Math.sin(time * 3.2 + d.wob) * 0.3 + (Math.random() - 0.5) * 0.3;
            // stick-slip: случайно снова залипает
            if (Math.random() < dt * 0.7) d.stick = 0.2 + Math.random() * 1.2;
            d.trail -= dt;
            if (d.trail <= 0) {
              trailSpecks.push({
                x: d.x + (Math.random() - 0.5) * 1.2,
                y: d.y - d.r * 1.2,
                r: d.r * (0.3 + Math.random() * 0.25),
                a: 0.45,
              });
              d.trail = 0.04 + Math.random() * 0.08;
            }
          }
          // Тело капли: преломление + блик
          ctx.fillStyle = "rgba(220, 235, 255, 0.10)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r, d.r * (1.25 + Math.min(0.8, d.vy * 0.012)), 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = "rgba(255, 255, 255, 0.40)";
          ctx.beginPath();
          ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.45, d.r * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }

        // Мерцание свечи (свеча на картинке справа внизу)
        const cx = w * 0.865, cy = h * 0.93;
        const flick = 0.7 + 0.22 * Math.sin(time * 7.3) + 0.08 * Math.sin(time * 15.7);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.16);
        glow.addColorStop(0, `rgba(255, 170, 80, ${0.16 * flick})`);
        glow.addColorStop(0.5, `rgba(255, 140, 60, ${0.06 * flick})`);
        glow.addColorStop(1, "rgba(255, 140, 60, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, h * 0.16, 0, Math.PI * 2); ctx.fill();

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[RainScene] draw error:", err);
        ctx.fillStyle = "#10141a";
        ctx.fillRect(0, 0, w, h);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ position: "fixed", inset: 0, zIndex: -10, background: "#10141a", display: "block", width: "100%", height: "100%" }}
    />
  );
}
