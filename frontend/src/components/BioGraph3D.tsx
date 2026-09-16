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
  const [progress, setProgress] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  // Анимация прорисовки
  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const duration = 2500;
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      // Easing: ease-out-cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [forecast]);

  // Отрисовка canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || forecast.length === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // High-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const W = rect.width;
    const H = rect.height;
    
    // 3D параметры
    const tiltX = tilt.x; // наклон по горизонтали (-0.3 до 0.3)
    const tiltY = 0.25 + tilt.y * 0.1; // наклон плоскости
    
    // Цвета
    const colors = {
      physical: { main: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" },
      emotional: { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },
      intellectual: { main: "#eab308", glow: "rgba(234, 179, 8, 0.4)" },
    };
    
    // Функция 3D-проекции
    const project = (x: number, y: number, z: number) => {
      // Перспективная проекция
      const fov = 800;
      const scale = fov / (fov + z);
      return {
        x: W / 2 + (x - W / 2) * scale + tiltX * z * 0.5,
        y: H * 0.55 + (y - H * 0.5) * scale * (1 - tiltY) - z * tiltY * 0.3,
        scale,
      };
    };
    
    // Очистка
    ctx.clearRect(0, 0, W, H);
    
    // Фон-градиент
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(15, 23, 42, 0.8)");
    bg.addColorStop(1, "rgba(30, 41, 59, 0.6)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    
    // Сетка-пол
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    const gridDepth = 8;
    const gridWidth = 20;
    
    // Горизонтальные линии (в глубину)
    for (let i = 0; i <= gridWidth; i++) {
      const x = (i / gridWidth) * W;
      const p1 = project(x, H * 0.7, -200);
      const p2 = project(x, H * 0.7, 200);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    
    // Вертикальные линии (по ширине)
    for (let i = 0; i <= gridDepth; i++) {
      const z = -200 + (i / gridDepth) * 400;
      const p1 = project(0, H * 0.7, z);
      const p2 = project(W, H * 0.7, z);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    
    // Средняя линия (0%)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.setLineDash([5, 5]);
    const midP1 = project(0, H * 0.45, 0);
    const midP2 = project(W, H * 0.45, 0);
    ctx.beginPath();
    ctx.moveTo(midP1.x, midP1.y);
    ctx.lineTo(midP2.x, midP2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Вертикальная линия "сегодня"
    const todayIdx = forecast.findIndex(f => f.today);
    if (todayIdx >= 0) {
      const x = (todayIdx / (forecast.length - 1)) * W;
      ctx.strokeStyle = "rgba(167, 139, 250, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      const topP = project(x, H * 0.15, 0);
      const botP = project(x, H * 0.75, 0);
      ctx.beginPath();
      ctx.moveTo(topP.x, topP.y);
      ctx.lineTo(botP.x, botP.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Точка "сегодня"
      ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
      ctx.beginPath();
      ctx.arc(topP.x, topP.y - 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Функция рисования линии со свечением
    const drawLine = (key: "physical" | "emotional" | "intellectual", color: typeof colors.physical) => {
      const points: { x: number; y: number; val: number }[] = [];
      const drawCount = Math.floor(forecast.length * progress);
      
      for (let i = 0; i < drawCount; i++) {
        const f = forecast[i];
        const x = (i / (forecast.length - 1)) * W;
        const yNorm = f[key] / 100; // -1 до 1
        const y = H * 0.45 - yNorm * H * 0.28;
        points.push({ x, y, val: f[key] });
      }
      
      if (points.length < 2) return;
      
      // Свечение (толстая прозрачная линия)
      ctx.strokeStyle = color.glow;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach((p, i) => {
        const pp = project(p.x, p.y, 0);
        if (i === 0) ctx.moveTo(pp.x, pp.y);
        else ctx.lineTo(pp.x, pp.y);
      });
      ctx.stroke();
      
      // Основная линия
      ctx.strokeStyle = color.main;
      ctx.lineWidth = 3;
      ctx.beginPath();
      points.forEach((p, i) => {
        const pp = project(p.x, p.y, 0);
        if (i === 0) ctx.moveTo(pp.x, pp.y);
        else ctx.lineTo(pp.x, pp.y);
      });
      ctx.stroke();
      
      // Точки на концах
      if (points.length > 0) {
        const last = points[points.length - 1];
        const pp = project(last.x, last.y, 0);
        
        // Внешний круг (свечение)
        ctx.fillStyle = color.glow;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Внутренний круг
        ctx.fillStyle = color.main;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Отражение (ниже плоскости, полупрозрачное)
      ctx.strokeStyle = color.glow.replace("0.4", "0.15");
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const reflectedY = H * 0.45 + (H * 0.45 - p.y);
        const pp = project(p.x, reflectedY, 0);
        if (i === 0) ctx.moveTo(pp.x, pp.y);
        else ctx.lineTo(pp.x, pp.y);
      });
      ctx.stroke();
    };
    
    // Рисуем все три линии
    drawLine("physical", colors.physical);
    drawLine("emotional", colors.emotional);
    drawLine("intellectual", colors.intellectual);
    
    // Даты снизу
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    for (let i = 0; i < forecast.length; i += 6) {
      const f = forecast[i];
      const x = (i / (forecast.length - 1)) * W;
      const p = project(x, H * 0.82, 0);
      ctx.fillText(f.date, p.x, p.y);
    }
    
  }, [forecast, progress, tilt]);

  // Обработка движения мыши для интерактивности
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div 
      className="relative rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: "420px" }}
      />
      <div className="absolute top-3 left-4 text-xs text-slate-500 flex items-center gap-2">
        <span>📊 3D</span>
        <span>Двигайте мышкой для эффекта</span>
      </div>
    </div>
  );
}
