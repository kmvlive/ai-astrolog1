"use client";

import { useEffect, useRef } from "react";

interface Flame { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; }

export default function FireScene() {
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

    let flames: Flame[] = [];
    let sparks: Spark[] = [];
    let smoke: Flame[] = [];

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
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

        const bx = w / 2, by = h * 0.82;
        const flick = 0.8 + 0.14 * Math.sin(time * 9.3) + 0.06 * Math.sin(time * 23.7);

        // ночное небо
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#04060d");
        sky.addColorStop(0.7, "#0a0d16");
        sky.addColorStop(1, "#0d0a08");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // звёзды
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        for (let i = 0; i < (isMobile ? 40 : 80); i++) {
          const sx = Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * w;
          const sy = Math.abs(Math.sin(i * 78.233) * 12345.678 % 1) * h * 0.6;
          const tw = 0.5 + 0.5 * Math.sin(time * 1.3 + i * 1.7);
          ctx.globalAlpha = tw * 0.5;
          ctx.fillRect(sx, sy, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;

        // земля
        ctx.fillStyle = "#080503";
        ctx.fillRect(0, h * 0.86, w, h * 0.14);
        const gg = ctx.createLinearGradient(0, h * 0.86, 0, h * 0.91);
        gg.addColorStop(0, `rgba(255, 120, 40, ${0.12 * flick})`);
        gg.addColorStop(1, "rgba(255, 120, 40, 0)");
        ctx.fillStyle = gg;
        ctx.fillRect(0, h * 0.86, w, h * 0.05);

        // тёплое сияние костра
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, h * 0.55);
        glow.addColorStop(0, `rgba(255, 140, 50, ${0.30 * flick})`);
        glow.addColorStop(0.4, `rgba(255, 100, 30, ${0.12 * flick})`);
        glow.addColorStop(1, "rgba(255, 100, 30, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // поленья
        ctx.save();
        ctx.translate(bx, by + h * 0.03);
        for (const [ang, len] of [[-0.35, 0.16], [0.35, 0.16], [0.05, 0.14]] as [number, number][]) {
          ctx.save();
          ctx.rotate(ang);
          ctx.fillStyle = "#170d06";
          ctx.fillRect(-w * len / 2, -h * 0.012, w * len, h * 0.024);
          ctx.fillStyle = `rgba(255, 130, 50, ${0.25 * flick})`;
          ctx.fillRect(-w * len / 2, -h * 0.012, w * len, h * 0.006);
          ctx.restore();
        }
        ctx.restore();

        // спавн частиц пламени
        const maxFlames = isMobile ? 70 : 140;
        if (flames.length < maxFlames) {
          const n = Math.ceil(dt * 220);
          for (let i = 0; i < n; i++) {
            flames.push({
              x: bx + (Math.random() - 0.5) * w * 0.07,
              y: by + (Math.random() - 0.5) * h * 0.01,
              vx: (Math.random() - 0.5) * 24,
              vy: -(70 + Math.random() * 130),
              life: 0,
              maxLife: 0.5 + Math.random() * 0.8,
              r: 6 + Math.random() * (isMobile ? 10 : 16),
            });
          }
        }
        if (Math.random() < dt * 6) {
          sparks.push({
            x: bx + (Math.random() - 0.5) * w * 0.05,
            y: by,
            vx: (Math.random() - 0.5) * 90,
            vy: -(160 + Math.random() * 220),
            life: 0,
            maxLife: 0.7 + Math.random() * 1.1,
          });
        }
        if (smoke.length < (isMobile ? 15 : 30) && Math.random() < dt * 12) {
          smoke.push({
            x: bx + (Math.random() - 0.5) * w * 0.03,
            y: by - h * 0.12,
            vx: (Math.random() - 0.5) * 10,
            vy: -(40 + Math.random() * 40),
            life: 0,
            maxLife: 2 + Math.random() * 2,
            r: 10 + Math.random() * 18,
          });
        }

        // дым
        for (const s of smoke) {
          s.life += dt;
          s.x += (s.vx + Math.sin(time * 1.2 + s.y * 0.01) * 12) * dt;
          s.y += s.vy * dt;
          const t = 1 - s.life / s.maxLife;
          if (t <= 0) continue;
          ctx.fillStyle = `rgba(120, 110, 100, ${0.05 * t})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * (1.6 - t * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
        smoke = smoke.filter((s) => s.life < s.maxLife);

        // пламя (аддитивно)
        ctx.globalCompositeOperation = "lighter";
        for (const f of flames) {
          f.life += dt;
          f.x += (f.vx + Math.sin(time * 10 + f.y * 0.03) * 18) * dt;
          f.y += f.vy * dt;
          f.vy -= 60 * dt;
          const t = 1 - f.life / f.maxLife;
          if (t <= 0) continue;
          let col: string;
          if (t > 0.72) col = `rgba(255, 240, 180, ${0.5 * t})`;
          else if (t > 0.4) col = `rgba(255, 150, 50, ${0.45 * t})`;
          else col = `rgba(210, 60, 20, ${0.4 * t})`;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(f.x, f.y, Math.max(0.5, f.r * t), 0, Math.PI * 2);
          ctx.fill();
        }
        flames = flames.filter((f) => f.life < f.maxLife);

        // искры
        for (const s of sparks) {
          s.life += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 60 * dt;
          const t = 1 - s.life / s.maxLife;
          if (t <= 0) continue;
          const tw = 0.6 + 0.4 * Math.sin(time * 30 + s.x);
          ctx.fillStyle = `rgba(255, 210, 120, ${0.8 * t * tw})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        sparks = sparks.filter((s) => s.life < s.maxLife);
        ctx.globalCompositeOperation = "source-over";

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[FireScene]", err);
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
