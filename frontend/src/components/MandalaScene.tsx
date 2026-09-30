"use client";

import { useEffect, useRef } from "react";

export default function MandalaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, cx = 0, cy = 0;
    const isMobile = typeof window !== "undefined" && (navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);

    // Слои мандалы: каждый со своей симметрией, радиусом, скоростью вращения
    type Layer = {
      sym: number;        // число симметрии (лепестков)
      rBase: number;      // базовый радиус (% от минимума)
      rAmp: number;       // амплитуда пульсации
      rFreq: number;      // частота пульсации
      omega: number;      // скорость вращения рад/сек
      kind: "petal" | "diamond" | "dot" | "ring";
      color: [number, number, number];
      alpha: number;
      size: number;       // размер элемента (% от радиуса)
    };

    const layers: Layer[] = [
      { sym: 16, rBase: 0.10, rAmp: 0.008, rFreq: 0.6, omega: -0.15, kind: "dot",    color: [255, 230, 150], alpha: 0.95, size: 0.025 },
      { sym: 8,  rBase: 0.18, rAmp: 0.014, rFreq: 0.5, omega:  0.10, kind: "petal",  color: [200, 140, 255], alpha: 0.85, size: 0.07  },
      { sym: 12, rBase: 0.28, rAmp: 0.018, rFreq: 0.4, omega: -0.07, kind: "diamond",color: [120, 200, 255], alpha: 0.75, size: 0.055 },
      { sym: 24, rBase: 0.38, rAmp: 0.012, rFreq: 0.7, omega:  0.05, kind: "dot",    color: [255, 200, 220], alpha: 0.70, size: 0.015 },
      { sym: 8,  rBase: 0.50, rAmp: 0.022, rFreq: 0.3, omega: -0.04, kind: "petal",  color: [255, 180, 100], alpha: 0.65, size: 0.09  },
      { sym: 16, rBase: 0.62, rAmp: 0.015, rFreq: 0.5, omega:  0.03, kind: "ring",   color: [160, 220, 255], alpha: 0.55, size: 0.04  },
      { sym: 12, rBase: 0.76, rAmp: 0.025, rFreq: 0.4, omega: -0.02, kind: "petal",  color: [220, 160, 255], alpha: 0.50, size: 0.11  },
      { sym: 32, rBase: 0.90, rAmp: 0.010, rFreq: 0.8, omega:  0.01, kind: "dot",    color: [255, 240, 200], alpha: 0.40, size: 0.010 },
    ];

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cx = w / 2; cy = h / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    let last = performance.now();
    const R = () => Math.min(w, h) / 2;

    const drawPetal = (r: number, size: number) => {
      ctx.beginPath();
      ctx.ellipse(0, -r, size * 0.5, size, 0, 0, Math.PI * 2);
    };
    const drawDiamond = (r: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -r - size);
      ctx.lineTo(size * 0.5, -r);
      ctx.lineTo(0, -r + size);
      ctx.lineTo(-size * 0.5, -r);
      ctx.closePath();
    };
    const drawDot = (r: number, size: number) => {
      ctx.beginPath();
      ctx.arc(0, -r, size, 0, Math.PI * 2);
    };
    const drawRing = (r: number, size: number) => {
      ctx.beginPath();
      ctx.arc(0, -r, size, 0, Math.PI * 2);
    };

    const draw = () => {
      try {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Глубокий фиолетово-чёрный фон
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
        grad.addColorStop(0, "#0a0618");
        grad.addColorStop(0.5, "#05020f");
        grad.addColorStop(1, "#000");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Звёздное поле на фоне
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < (isMobile ? 40 : 80); i++) {
          const sx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
          const sy = (Math.sin(i * 78.233) * 12345.678) % 1;
          const abs_sx = Math.abs(sx) * w;
          const abs_sy = Math.abs(sy) * h;
          const tw = 0.5 + 0.5 * Math.sin(time * 1.5 + i);
          ctx.globalAlpha = tw * 0.6;
          ctx.fillRect(abs_sx, abs_sy, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;

        // Центральное сияние
        const coreR = R() * 0.08;
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
        core.addColorStop(0, "rgba(255, 240, 200, 0.9)");
        core.addColorStop(0.3, "rgba(255, 200, 150, 0.4)");
        core.addColorStop(1, "rgba(255, 200, 150, 0)");
        ctx.fillStyle = core;
        ctx.beginPath(); ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2); ctx.fill();

        // Слои мандалы
        for (const L of layers) {
          const r = R() * (L.rBase + L.rAmp * Math.sin(time * L.rFreq));
          const rot = time * L.omega;
          const [cr, cg, cb] = L.color;
          const sz = R() * L.size;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${L.alpha * 0.8})`;
          ctx.shadowBlur = 14;
          for (let i = 0; i < L.sym; i++) {
            ctx.save();
            ctx.rotate((i / L.sym) * Math.PI * 2);
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${L.alpha})`;
            ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(1, L.alpha * 1.3)})`;
            ctx.lineWidth = 1.2;
            if (L.kind === "petal") {
              drawPetal(r, sz);
              ctx.fill();
              ctx.stroke();
            } else if (L.kind === "diamond") {
              drawDiamond(r, sz);
              ctx.fill();
              ctx.stroke();
            } else if (L.kind === "dot") {
              drawDot(r, sz);
              ctx.fill();
            } else if (L.kind === "ring") {
              drawRing(r, sz);
              ctx.stroke();
            }
            ctx.restore();
          }
          ctx.restore();
        }

        // Тонкая обводка внешних окружностей
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        for (const f of [0.25, 0.45, 0.65, 0.85]) {
          ctx.beginPath();
          ctx.arc(cx, cy, R() * f, 0, Math.PI * 2);
          ctx.stroke();
        }

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[MandalaScene]", err);
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
