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

const ARMS = 3; // три спиральных рукава
const PITCH_B = 0.36; // тангенс угла наклона спирали

// === ПЛАВНАЯ ПАЛИТРА как на референсе ===
// центр: бело-кремовый → персик → оранжево-коричневый диск →
// розово-лавандовый переход → жемчужно-голубые рукава → глубокий синий край
const STOPS: [number, [number, number, number]][] = [
  [0.00, [255, 250, 235]],
  [0.18, [255, 224, 178]],
  [0.34, [235, 175, 130]],
  [0.50, [215, 160, 190]],
  [0.66, [170, 150, 230]],
  [0.84, [130, 160, 240]],
  [1.00, [100, 130, 220]],
];

function palette(t: number): [number, number, number] {
  const tt = Math.max(0, Math.min(1, t));
  for (let i = 1; i < STOPS.length; i++) {
    if (tt <= STOPS[i][0]) {
      const [t0, c0] = STOPS[i - 1];
      const [t1, c1] = STOPS[i];
      const k = (tt - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
      ];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function particleColor(t: number, rnd: () => number): [number, number, number] {
  const roll = rnd();
  if (t > 0.45 && roll < 0.05) return [244, 114, 200]; // розовые HII-области
  if (t > 0.55 && roll < 0.14) return [150, 190, 255]; // яркие голубые скопления
  if (t < 0.35 && roll < 0.10) return [255, 240, 210]; // тёплые звёзды ядра
  return palette(t + (rnd() - 0.5) * 0.08);            // лёгкий джиттер для живости
}

export default function GalaxyScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    let bgStars: BgStar[] = [];
    let brightStars: BrightStar[] = [];
    let layers: HTMLCanvasElement[] = [];
    let layerHalf = 0;
    let galaxyR = 0;
    const rot = [0.6, 0.6, 0.6];
    const OMEGA = [0.022, 0.013, 0.008]; // медленное дифференциальное вращение

    const cometSys = new CometSystem();

    function buildStars() {
      bgStars = [];
      const count = Math.round((w * h) / 8000);
      for (let i = 0; i < count; i++) {
        const cRoll = hash(i * 3.7);
        let cr = 255, cg = 255, cb = 255;
        if (cRoll < 0.20) { cr = 190; cg = 215; cb = 255; }      // голубые
        else if (cRoll < 0.42) { cr = 255; cg = 200; cb = 160; } // лососёво-оранжевые
        else if (cRoll < 0.50) { cr = 255; cg = 180; cb = 210; } // розовые
        bgStars.push({
          x: hash(i * 1.13) * w,
          y: hash(i * 2.31) * h,
          r: 0.3 + hash(i * 4.77) * 1.5,
          baseAlpha: 0.25 + hash(i * 5.19) * 0.75,
          speed: 0.4 + hash(i * 6.71) * 2.2,
          phase: hash(i * 7.93) * Math.PI * 2,
          cr, cg, cb,
        });
      }
      brightStars = [];
      for (let i = 0; i < 8; i++) {
        const cRoll = hash(i * 11.3 + 5);
        brightStars.push({
          x: hash(i * 13.7 + 1) * w,
          y: hash(i * 17.9 + 2) * h * 0.9,
          r: 2.4 + hash(i * 19.1 + 3) * 2.2,
          phase: hash(i * 23.3 + 4) * Math.PI * 2,
          cr: cRoll < 0.5 ? 255 : 180,
          cg: cRoll < 0.5 ? 245 : 210,
          cb: cRoll < 0.5 ? 225 : 255,
        });
      }
    }

    function buildGalaxy() {
      galaxyR = Math.min(w, h) * 0.42; // галактика подальше
      const S = Math.ceil(galaxyR * 2.3);
      layerHalf = S / 2;
      const C = S / 2;
      layers = [0, 1, 2].map(() => {
        const c = document.createElement("canvas");
        c.width = S; c.height = S;
        return c;
      });
      const lctx = layers.map((c) => c.getContext("2d")!);

      const seed = { s: 987654321 };
      const rnd = () => {
        seed.s = (seed.s * 1664525 + 1013904223) % 4294967296;
        return seed.s / 4294967296;
      };

      // === ЧАСТИЦЫ РУКАВОВ ===
      const TOTAL = Math.max(1600, Math.round(3900 * Math.min(1, (w * h) / (1280 * 800)))); // адаптивно: меньше частиц на телефонах
      for (let i = 0; i < TOTAL; i++) {
        const t = Math.pow(rnd(), 0.62);
        const r = galaxyR * (0.05 + 0.95 * t);
        const arm = i % ARMS;
        const theta =
          arm * ((Math.PI * 2) / ARMS) +
          Math.log(r / (galaxyR * 0.05)) / PITCH_B +
          (rnd() - 0.5) * (0.45 + t * 1.15);
        const rr = r * (1 + (rnd() - 0.5) * 0.15);
        const x = C + Math.cos(theta) * rr;
        const y = C + Math.sin(theta) * rr;

        const layerIdx = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
        const g = lctx[layerIdx];
        const [cr, cg, cb] = particleColor(t, rnd);
        const size = 0.6 + rnd() * 1.8;
        const alpha = 0.25 + rnd() * 0.6;

        const glow = g.createRadialGradient(x, y, 0, x, y, size * 4);
        glow.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.5})`);
        glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        g.fillStyle = glow;
        g.beginPath(); g.arc(x, y, size * 4, 0, Math.PI * 2); g.fill();

        g.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        g.beginPath(); g.arc(x, y, size, 0, Math.PI * 2); g.fill();
      }

      // === ДЫМКА РУКАВОВ (широкие мягкие мазки вдоль спирали) ===
      for (let arm = 0; arm < ARMS; arm++) {
        for (let s = 0; s < 110; s++) {
          const t = s / 110;
          const r = galaxyR * (0.08 + 0.92 * t);
          const theta =
            arm * ((Math.PI * 2) / ARMS) +
            Math.log(r / (galaxyR * 0.05)) / PITCH_B;
          const layerIdx = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
          const g = lctx[layerIdx];
          const x = C + Math.cos(theta) * r;
          const y = C + Math.sin(theta) * r;
          const [cr, cg, cb] = palette(t);
          const rad = galaxyR * (0.05 + 0.06 * rnd());
          const haze = g.createRadialGradient(x, y, 0, x, y, rad);
          haze.addColorStop(0, `rgba(${cr},${cg},${cb},0.06)`);
          haze.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          g.fillStyle = haze;
          g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
        }
      }

      // === ПЫЛЕВЫЕ ПОЛОСЫ (тёмные дорожки вдоль внутреннего края рукавов) ===
      for (let arm = 0; arm < ARMS; arm++) {
        let prevX = 0, prevY = 0;
        for (let s = 0; s <= 70; s++) {
          const t = 0.10 + (s / 70) * 0.62;
          const r = galaxyR * t;
          const theta =
            arm * ((Math.PI * 2) / ARMS) +
            Math.log(r / (galaxyR * 0.05)) / PITCH_B - 0.28;
          const wob = (hash(arm * 137 + s * 3.1) * 2 - 1) * 0.05;
          const x = C + Math.cos(theta + wob) * r;
          const y = C + Math.sin(theta + wob) * r;
          if (s > 0) {
            const layerIdx = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
            const g = lctx[layerIdx];
            // окно прозрачности: пыль плавно исчезает на границах слоёв
            let win = 1;
            if (t < 0.40) win = Math.min(win, (t - 0.34 + 0.06) / 0.06);
            if (t > 0.62) win = Math.min(win, (0.68 + 0.06 - t) / 0.06);
            win = Math.max(0, Math.min(1, win));
            g.strokeStyle = `rgba(40,26,22,${0.30 * win * (1 - t * 0.7)})`;
            g.lineWidth = galaxyR * 0.05 * (1 - t * 0.5);
            g.lineCap = "round";
            g.beginPath(); g.moveTo(prevX, prevY); g.lineTo(x, y); g.stroke();
          }
          prevX = x; prevY = y;
        }
      }
    }

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      buildStars();
      buildGalaxy();
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => resize()).observe(canvas);
    }

    let time = 0;
    let last = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

    try {
      // Мобильная страховка: размер мог измениться (URL-бар, поворот)
      if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // чистый трансформ каждый кадр

      // === ФОН ===
      ctx.globalCompositeOperation = "source-over";
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#05050f");
      bg.addColorStop(0.5, "#080814");
      bg.addColorStop(1, "#05050e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // мерцающие звёзды фона
      for (const s of bgStars) {
        const tw = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase);
        ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${s.baseAlpha * tw})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      // === ТЁМНЫЕ ТУМАННОСТИ (дымные силуэты как на референсе) ===
      for (let i = 0; i < 6; i++) {
        const nx = hash(i * 31.7 + 9) * w;
        const ny = hash(i * 37.3 + 4) * h;
        const nr = (0.10 + hash(i * 41.9 + 2) * 0.14) * Math.max(w, h);
        const neb = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        neb.addColorStop(0, "rgba(4,4,10,0.42)");
        neb.addColorStop(0.6, "rgba(6,6,14,0.22)");
        neb.addColorStop(1, "rgba(6,6,14,0)");
        ctx.fillStyle = neb;
        ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fill();
      }

      // === КРУПНЫЕ МОРГАЮЩИЕ ЗВЁЗДЫ (без крестов) ===
      ctx.globalCompositeOperation = "lighter";
      for (const b of brightStars) {
        const tw = 0.5 + 0.5 * Math.sin(time * 0.5 + b.phase); // 0..1 — без отрицательного радиуса
        const R = Math.max(0.1, b.r * 5 * tw);
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, R);
        grad.addColorStop(0, `rgba(${b.cr},${b.cg},${b.cb},${0.95 * tw})`);
        grad.addColorStop(0.25, `rgba(${b.cr},${b.cg},${b.cb},${0.30 * tw})`);
        grad.addColorStop(1, `rgba(${b.cr},${b.cg},${b.cb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2); ctx.fill();
      }

      // === ГАЛАКТИКА ===
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.32);
      ctx.scale(1, 0.40);

      // внешнее гало (сине-фиолетовое свечение вокруг диска)
      const halo = ctx.createRadialGradient(0, 0, galaxyR * 0.1, 0, 0, galaxyR * 1.25);
      halo.addColorStop(0, "rgba(190,170,225,0.22)");
      halo.addColorStop(0.4, "rgba(150,145,225,0.11)");
      halo.addColorStop(0.75, "rgba(105,120,215,0.05)");
      halo.addColorStop(1, "rgba(85,100,200,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, galaxyR * 1.25, 0, Math.PI * 2); ctx.fill();

      // слои рукавов: внешний → средний → внутренний
      ctx.globalCompositeOperation = "source-over";
      for (let i = layers.length - 1; i >= 0; i--) {
        rot[i] += OMEGA[i] * dt;
        ctx.save();
        ctx.rotate(rot[i]);
        ctx.drawImage(layers[i], -layerHalf, -layerHalf);
        ctx.restore();
      }

      // ядро: вытянутое вдоль диска, бело-кремовое → персик → тёплый тан
      ctx.globalCompositeOperation = "lighter";
      ctx.save();
      ctx.scale(1.7, 1);
      const coreR = galaxyR * 0.34;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
      core.addColorStop(0, "rgba(255,252,240,0.98)");
      core.addColorStop(0.18, "rgba(255,236,200,0.85)");
      core.addColorStop(0.40, "rgba(250,200,150,0.45)");
      core.addColorStop(0.70, "rgba(230,170,140,0.16)");
      core.addColorStop(1, "rgba(220,160,150,0)");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, coreR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.restore();

      // === КОМЕТЫ ===
      cometSys.update(ctx, w, h, time, dt);
      ctx.globalCompositeOperation = "source-over";

      time += dt;
      raf = requestAnimationFrame(draw);
    } catch (err) {
      console.error("[GalaxyScene] draw error:", err);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#05050f";
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
      style={{ position: "fixed", inset: 0, zIndex: -10, background: "#05050f", display: "block", width: "100%", height: "100%" }}
    />
  );
}
