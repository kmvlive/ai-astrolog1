"use client";

import { useEffect, useRef } from "react";
import { CometSystem, hash } from "@/lib/scenePaint";

interface BgStar {
  x: number; y: number; r: number;
  baseAlpha: number; speed: number; phase: number;
  cr: number; cg: number; cb: number;
}

interface BrightStar {
  x: number; y: number; r: number; phase: number;
  cr: number; cg: number; cb: number;
}

const ARMS = 2;
const PITCH_B = 0.36; // tan(20°) — крутизна логарифмической спирали

export default function GalaxyScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let bgStars: BgStar[] = [];
    let brightStars: BrightStar[] = [];
    let layers: HTMLCanvasElement[] = [];
    let layerHalf = 0;
    let galaxyR = 0;
    // углы слоёв стартуют одинаково — рукава совпадают между слоями
    const rot = [0.6, 0.6, 0.6];
    const OMEGA = [0.055, 0.032, 0.019]; // дифференциальное вращение: центр быстрее

    const cometSys = new CometSystem();

    const pickColor = (t: number, rnd: () => number): [number, number, number] => {
      if (rnd() < 0.06) return [255, 150, 200]; // розовые HII-области
      if (t < 0.30) return [255, 214, 170];     // тёплый центр
      if (t < 0.62) return [216, 180, 254];     // фиолетовые рукава
      return [147, 197, 253];                   // голубой край
    };

    function buildStars() {
      bgStars = [];
      const count = Math.round((w * h) / 9000);
      for (let i = 0; i < count; i++) {
        const cRoll = hash(i * 3.7);
        let cr = 255, cg = 255, cb = 255;
        if (cRoll < 0.18) { cr = 190; cg = 220; cb = 255; }
        else if (cRoll < 0.30) { cr = 255; cg = 220; cb = 180; }
        else if (cRoll < 0.35) { cr = 255; cg = 190; cb = 220; }
        bgStars.push({
          x: hash(i * 1.13) * w,
          y: hash(i * 2.31) * h,
          r: 0.3 + hash(i * 4.77) * 1.4,
          baseAlpha: 0.25 + hash(i * 5.19) * 0.75,
          speed: 0.4 + hash(i * 6.71) * 2.2,
          phase: hash(i * 7.93) * Math.PI * 2,
          cr, cg, cb,
        });
      }
      brightStars = [];
      for (let i = 0; i < 7; i++) {
        const cRoll = hash(i * 11.3 + 5);
        brightStars.push({
          x: hash(i * 13.7 + 1) * w,
          y: hash(i * 17.9 + 2) * h * 0.9,
          r: 2.4 + hash(i * 19.1 + 3) * 2.2,
          phase: hash(i * 23.3 + 4) * Math.PI * 2,
          cr: cRoll < 0.5 ? 255 : 190,
          cg: cRoll < 0.5 ? 240 : 215,
          cb: cRoll < 0.5 ? 220 : 255,
        });
      }
    }

    function buildGalaxy() {
      galaxyR = Math.min(w, h) * 0.42; // галактика подальше
      const S = Math.ceil(galaxyR * 2.15);
      layerHalf = S / 2;
      const C = S / 2;
      layers = [0, 1, 2].map(() => {
        const c = document.createElement("canvas");
        c.width = S; c.height = S;
        return c;
      });
      const lctx = layers.map((c) => c.getContext("2d")!);

      const seed = { s: 1234567 };
      const rnd = () => {
        seed.s = (seed.s * 1664525 + 1013904223) % 4294967296;
        return seed.s / 4294967296;
      };

      // Частицы рукавов
      const TOTAL = 2600;
      for (let i = 0; i < TOTAL; i++) {
        const t = Math.pow(rnd(), 0.65); // плотнее к центру
        const r = galaxyR * (0.06 + 0.94 * t);
        const arm = i % ARMS;
        const theta =
          arm * ((Math.PI * 2) / ARMS) +
          Math.log(r / (galaxyR * 0.06)) / PITCH_B +
          (rnd() - 0.5) * (0.5 + t * 1.1);
        const rr = r * (1 + (rnd() - 0.5) * 0.16);
        const x = C + Math.cos(theta) * rr;
        const y = C + Math.sin(theta) * rr;

        const layerIdx = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
        const g = lctx[layerIdx];
        const [cr, cg, cb] = pickColor(t, rnd);
        const size = 0.6 + rnd() * 1.7;
        const alpha = 0.25 + rnd() * 0.6;

        const glow = g.createRadialGradient(x, y, 0, x, y, size * 4);
        glow.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.5})`);
        glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        g.fillStyle = glow;
        g.beginPath(); g.arc(x, y, size * 4, 0, Math.PI * 2); g.fill();

        g.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        g.beginPath(); g.arc(x, y, size, 0, Math.PI * 2); g.fill();
      }

      // Дымка вдоль рукавов
      for (let arm = 0; arm < ARMS; arm++) {
        for (let s = 0; s < 90; s++) {
          const t = s / 90;
          const r = galaxyR * (0.10 + 0.90 * t);
          const theta =
            arm * ((Math.PI * 2) / ARMS) +
            Math.log(r / (galaxyR * 0.06)) / PITCH_B;
          const layerIdx = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
          const g = lctx[layerIdx];
          const x = C + Math.cos(theta) * r;
          const y = C + Math.sin(theta) * r;
          const [cr, cg, cb] = pickColor(t, rnd);
          const rad = galaxyR * (0.05 + 0.05 * rnd());
          const haze = g.createRadialGradient(x, y, 0, x, y, rad);
          haze.addColorStop(0, `rgba(${cr},${cg},${cb},0.05)`);
          haze.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          g.fillStyle = haze;
          g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
        }
      }
    }

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      buildGalaxy();
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;
    let last = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Фон глубокого космоса
      ctx.globalCompositeOperation = "source-over";
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#04040c");
      bg.addColorStop(0.5, "#070714");
      bg.addColorStop(1, "#05050e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Мерцающие звёзды
      for (const s of bgStars) {
        const tw = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase);
        ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${s.baseAlpha * tw})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      // Яркие звёзды с дифракционными лучами
      ctx.globalCompositeOperation = "lighter";
      for (const b of brightStars) {
        const tw = 0.45 + 0.55 * Math.sin(time * 0.5 + b.phase); // более заметное мерцание
        const R = b.r * 6 * tw;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, R);
        grad.addColorStop(0, `rgba(${b.cr},${b.cg},${b.cb},${0.9 * tw})`);
        grad.addColorStop(0.2, `rgba(${b.cr},${b.cg},${b.cb},${0.25 * tw})`);
        grad.addColorStop(1, `rgba(${b.cr},${b.cg},${b.cb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2); ctx.fill();
        // без крестов — только мягкое свечение
      }

      // Галактика: наклон диска + сжатие (вид под углом)
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.32);
      ctx.scale(1, 0.42);

      // Ядро
      const coreR = galaxyR * 0.30;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
      core.addColorStop(0, "rgba(255,250,235,0.95)");
      core.addColorStop(0.25, "rgba(255,224,178,0.55)");
      core.addColorStop(0.6, "rgba(255,190,140,0.18)");
      core.addColorStop(1, "rgba(255,190,140,0)");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, coreR, 0, Math.PI * 2); ctx.fill();

      // Рукава: 3 слоя с разной скоростью вращения
      for (let i = 0; i < layers.length; i++) {
        rot[i] += OMEGA[i] * dt;
        ctx.save();
        ctx.rotate(rot[i]);
        ctx.drawImage(layers[i], -layerHalf, -layerHalf);
        ctx.restore();
      }
      ctx.restore();

      // Кометы поверх
      cometSys.update(ctx, w, h, time, dt);
      ctx.globalCompositeOperation = "source-over";

      time += dt;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
