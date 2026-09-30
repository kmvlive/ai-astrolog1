"use client";

import { useEffect, useRef } from "react";

interface Flake { x: number; y: number; r: number; v: number; sw: number; ph: number; a: number; }

export default function SnowScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const isMobile = typeof window !== "undefined" && (navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
    let flakes: Flake[] = [];

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const af = Math.min(1, (w * h) / (1280 * 800));
      const mk = (n: number, rMin: number, rMax: number, vMin: number, vMax: number, a: number) =>
        Array.from({ length: Math.round(n) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rMin + Math.random() * (rMax - rMin),
          v: vMin + Math.random() * (vMax - vMin),
          sw: 0.5 + Math.random() * 1.5,
          ph: Math.random() * Math.PI * 2,
          a,
        }));
      flakes = [
        ...mk(30 + 100 * af, 0.8, 1.6, 16, 28, 0.35),
        ...mk(20 + 60 * af, 1.8, 2.8, 38, 58, 0.55),
        ...mk(10 + 30 * af, 3.0, 4.6, 70, 100, 0.85),
      ];
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    let last = performance.now();

    const tree = (x: number, base: number, s: number) => {
      ctx.fillStyle = "#0a111f";
      for (let i = 0; i < 3; i++) {
        const ty = base - s * 0.45 * i;
        const tw2 = s * (0.5 - i * 0.12);
        const th = s * 0.55;
        ctx.beginPath();
        ctx.moveTo(x, ty - th);
        ctx.lineTo(x - tw2, ty);
        ctx.lineTo(x + tw2, ty);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillRect(x - s * 0.05, base - 2, s * 0.1, s * 0.12);
      // снежная шапка
      ctx.fillStyle = "rgba(220, 232, 248, 0.22)";
      ctx.beginPath();
      ctx.moveTo(x, base - s * 0.9 - s * 0.55);
      ctx.lineTo(x - s * 0.2, base - s * 0.9);
      ctx.lineTo(x + s * 0.2, base - s * 0.9);
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      try {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // ночное небо
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#0a1226");
        sky.addColorStop(0.7, "#15233f");
        sky.addColorStop(1, "#1c2c4c");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // звёзды
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        for (let i = 0; i < (isMobile ? 30 : 60); i++) {
          const sx = Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * w;
          const sy = Math.abs(Math.sin(i * 78.233) * 12345.678 % 1) * h * 0.5;
          const tw = 0.5 + 0.5 * Math.sin(time * 1.2 + i);
          ctx.globalAlpha = tw * 0.5;
          ctx.fillRect(sx, sy, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;

        // луна с ореолом
        const mx = w * 0.78, my = h * 0.16;
        const halo = ctx.createRadialGradient(mx, my, 0, mx, my, h * 0.2);
        halo.addColorStop(0, "rgba(220, 235, 255, 0.35)");
        halo.addColorStop(1, "rgba(220, 235, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(mx, my, h * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#eef4ff";
        ctx.beginPath(); ctx.arc(mx, my, h * 0.045, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(180, 200, 230, 0.5)";
        ctx.beginPath(); ctx.arc(mx - h * 0.012, my - h * 0.008, h * 0.009, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + h * 0.014, my + h * 0.012, h * 0.006, 0, Math.PI * 2); ctx.fill();

        // снежная земля
        const gr = ctx.createLinearGradient(0, h * 0.86, 0, h);
        gr.addColorStop(0, "#b9c7db");
        gr.addColorStop(0.3, "#8fa0ba");
        gr.addColorStop(1, "#5d6f8c");
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.9);
        for (let x = 0; x <= w; x += w / 24) {
          ctx.lineTo(x, h * 0.9 + Math.sin(x * 0.01 + 2) * h * 0.012);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // ели
        tree(w * 0.08, h * 0.9, h * 0.16);
        tree(w * 0.22, h * 0.92, h * 0.22);
        tree(w * 0.45, h * 0.9, h * 0.13);
        tree(w * 0.66, h * 0.93, h * 0.25);
        tree(w * 0.9, h * 0.91, h * 0.18);

        // ветер
        const wind = Math.sin(time * 0.12) * 14 + Math.sin(time * 0.05) * 10;

        // снежинки (3 слоя параллакса)
        for (const f of flakes) {
          f.y += f.v * dt;
          f.x += (wind * (0.3 + f.r * 0.18) + Math.sin(time * f.sw + f.ph) * 12) * dt;
          if (f.y > h * 0.92) { f.y = -5; f.x = Math.random() * w; }
          if (f.x > w + 10) f.x = -10;
          if (f.x < -10) f.x = w + 10;
          ctx.fillStyle = `rgba(240, 248, 255, ${f.a})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // лёгкий туман
        for (let i = 0; i < 2; i++) {
          const fy = h * (0.75 + i * 0.08);
          const fx = ((time * (8 + i * 5)) % (w * 1.5)) - w * 0.25;
          const fog = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.4);
          fog.addColorStop(0, "rgba(200, 215, 240, 0.05)");
          fog.addColorStop(1, "rgba(200, 215, 240, 0)");
          ctx.fillStyle = fog;
          ctx.fillRect(0, 0, w, h);
        }

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[SnowScene]", err);
        ctx.fillStyle = "#000";
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
      style={{ position: "fixed", inset: 0, zIndex: -10, background: "#000", display: "block", width: "100%", height: "100%" }}
    />
  );
}
