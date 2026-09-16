"use client";

import { useEffect, useRef, useState } from "react";

interface ForecastPoint {
  date: string;
  day: number;
  physical: number;
  emotional: number;
  intellectual: number;
  today: boolean;
}

interface Props {
  forecast: ForecastPoint[];
}

export default function BioGraph3D({ forecast }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  // Старт анимации когда график попал в поле зрения
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Анимация прорисовки (медленнее: 3.2s)
  useEffect(() => {
    if (!started) return;
    setProgress(0);
    const start = performance.now();
    const duration = 3200;

    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setProgress(1 - Math.pow(1 - p, 3)); // ease-out-cubic
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [forecast, started]);

  // Отрисовка canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || forecast.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Компактная компоновка: линии занимают почти всю высоту
    const centerY = H * 0.44;   // линия 0%
    const amp = H * 0.34;       // амплитуда (линии от 0.10H до 0.78H)
    const gridY = H * 0.82;     // сетка-пол
    const dateY = H * 0.96;     // подписи дат

    const tiltX = tilt.x;
    const tiltY = 0.22 + tilt.y * 0.08;

    const colors = {
      physical: { main: "#ef4444", glow: "rgba(239, 68, 68, 0.35)" },
      emotional: { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.35)" },
      intellectual: { main: "#eab308", glow: "rgba(234, 179, 8, 0.35)" },
    };

    const project = (x: number, y: number, z: number) => {
      const fov = 800;
      const scale = fov / (fov + z);
      return {
        x: W / 2 + (x - W / 2) * scale + tiltX * z * 0.5,
        y: centerY + (y - centerY) * scale * (1 - tiltY) - z * tiltY * 0.25,
        scale,
      };
    };

    ctx.clearRect(0, 0, W, H);

    // Фон
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(15, 23, 42, 0.8)");
    bg.addColorStop(1, "rgba(30, 41, 59, 0.6)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Сетка-пол
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * W;
      const p1 = project(x, gridY, -200);
      const p2 = project(x, gridY, 200);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const z = -200 + (i / 8) * 400;
      const p1 = project(0, gridY, z);
      const p2 = project(W, gridY, z);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    // Средняя линия (0%)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.setLineDash([5, 5]);
    const m1 = project(0, centerY, 0);
    const m2 = project(W, centerY, 0);
    ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
    ctx.setLineDash([]);

    // Маркер "сегодня"
    const todayIdx = forecast.findIndex(f => f.today);
    if (todayIdx >= 0) {
      const x = (todayIdx / (forecast.length - 1)) * W;
      ctx.strokeStyle = "rgba(167, 139, 250, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      const top = project(x, H * 0.06, 0);
      const bot = project(x, gridY, 0);
      ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
      ctx.beginPath(); ctx.arc(top.x, top.y, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Линии со свечением
    const drawLine = (key: "physical" | "emotional" | "intellectual", color: typeof colors.physical) => {
      const drawCount = Math.floor(forecast.length * progress);
      if (drawCount < 2) return;
      const pts = forecast.slice(0, drawCount).map((f, i) => ({
        x: (i / (forecast.length - 1)) * W,
        y: centerY - (f[key] / 100) * amp,
      }));

      // Отражение
      ctx.strokeStyle = color.glow.replace("0.35", "0.12");
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const pp = project(p.x, 2 * centerY - p.y, 0);
        i === 0 ? ctx.moveTo(pp.x, pp.y) : ctx.lineTo(pp.x, pp.y);
      });
      ctx.stroke();

      // Свечение
      ctx.strokeStyle = color.glow;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach((p, i) => {
        const pp = project(p.x, p.y, 0);
        i === 0 ? ctx.moveTo(pp.x, pp.y) : ctx.lineTo(pp.x, pp.y);
      });
      ctx.stroke();

      // Основная линия
      ctx.strokeStyle = color.main;
      ctx.lineWidth = 3;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const pp = project(p.x, p.y, 0);
        i === 0 ? ctx.moveTo(pp.x, pp.y) : ctx.lineTo(pp.x, pp.y);
      });
      ctx.stroke();

      // Точка на конце
      const last = pts[pts.length - 1];
      const lp = project(last.x, last.y, 0);
      ctx.fillStyle = color.glow;
      ctx.beginPath(); ctx.arc(lp.x, lp.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color.main;
      ctx.beginPath(); ctx.arc(lp.x, lp.y, 4, 0, Math.PI * 2); ctx.fill();
    };

    drawLine("physical", colors.physical);
    drawLine("emotional", colors.emotional);
    drawLine("intellectual", colors.intellectual);

    // Даты
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    for (let i = 0; i < forecast.length; i += 6) {
      const x = (i / (forecast.length - 1)) * W;
      const p = project(x, dateY, 0);
      ctx.fillText(forecast[i].date, p.x, p.y);
    }
  }, [forecast, progress, tilt]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTilt({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 0.3,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 0.3,
    });
  };

  return (
    <div
      ref={wrapRef}
      className="relative rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <canvas ref={canvasRef} className="w-full block" style={{ height: "320px" }} />
      <div className="absolute top-3 left-4 text-xs text-slate-500 flex items-center gap-2">
        <span>📊 3D</span>
        <span>Двигайте мышкой для эффекта</span>
      </div>
    </div>
  );
}
