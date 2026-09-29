"use client";

import { useEffect, useRef } from "react";
import { hash } from "@/lib/scenePaint";

interface Drop { x: number; y: number; r: number; vy: number; stick: number; wob: number; trail: number; }
interface Speck { x: number; y: number; r: number; a: number; }
interface Streak { x: number; y: number; len: number; v: number; a: number; }
interface Car { x: number; v: number; y: number; red: boolean; }

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

    let street: HTMLCanvasElement | null = null;
    let specks: HTMLCanvasElement | null = null;
    let drops: Drop[] = [];
    let trailSpecks: Speck[] = [];
    let streaks: Streak[] = [];
    let cars: Car[] = [];

    function buildStreet() {
      street = document.createElement("canvas");
      street.width = w; street.height = h;
      const g = street.getContext("2d")!;
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#3a4450");
      grad.addColorStop(0.5, "#2a313b");
      grad.addColorStop(1, "#151a20");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);

      // размытые силуэты зданий
      for (let i = 0; i < 8; i++) {
        const bw = w * (0.10 + hash(i * 3.3) * 0.16);
        const bx = hash(i * 7.7) * w - bw / 2;
        const bh = h * (0.30 + hash(i * 5.1) * 0.35);
        const by = h * 0.62 - bh;
        g.fillStyle = `rgba(${18 + Math.round(hash(i + 1) * 14)}, ${20 + Math.round(hash(i + 2) * 14)}, ${26 + Math.round(hash(i + 3) * 14)}, 0.55)`;
        g.fillRect(bx, by, bw, bh);
      }

      // боке: огни города
      const palette: [number, number, number][] = [
        [255, 190, 100], [255, 150, 70], [255, 90, 80],
        [90, 170, 255], [255, 240, 220], [120, 220, 255], [255, 120, 180],
      ];
      for (let i = 0; i < 46; i++) {
        const p = palette[Math.floor(hash(i * 9.1) * palette.length)];
        const x = hash(i * 1.7) * w;
        const y = h * (0.18 + hash(i * 2.9) * 0.5);
        const r = 6 + hash(i * 4.3) * 46;
        const a = 0.10 + hash(i * 6.1) * 0.35;
        const bg = g.createRadialGradient(x, y, 0, x, y, r);
        bg.addColorStop(0, `rgba(${p[0]},${p[1]},${p[2]},${a})`);
        bg.addColorStop(0.7, `rgba(${p[0]},${p[1]},${p[2]},${a * 0.4})`);
        bg.addColorStop(1, `rgba(${p[0]},${p[1]},${p[2]},0)`);
        g.fillStyle = bg;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }

      // мокрый асфальт: вертикальные отражения огней
      for (let i = 0; i < 14; i++) {
        const p = palette[Math.floor(hash(i * 13.7) * palette.length)];
        const x = hash(i * 11.3) * w;
        const y0 = h * (0.66 + hash(i * 5.9) * 0.06);
        const rl = h * (0.10 + hash(i * 3.1) * 0.18);
        const rw = 4 + hash(i * 7.3) * 14;
        const rg = g.createLinearGradient(0, y0, 0, y0 + rl);
        rg.addColorStop(0, `rgba(${p[0]},${p[1]},${p[2]},0.14)`);
        rg.addColorStop(1, `rgba(${p[0]},${p[1]},${p[2]},0)`);
        g.fillStyle = rg;
        g.fillRect(x - rw / 2, y0, rw, rl);
      }
    }

    function buildSpecks() {
      specks = document.createElement("canvas");
      specks.width = w; specks.height = h;
      const g = specks.getContext("2d")!;
      const count = Math.round((w * h) / 4500);
      for (let i = 0; i < count; i++) {
        const x = hash(i * 1.31) * w;
        const y = hash(i * 2.77) * h * 0.86;
        const r = 0.4 + hash(i * 3.91) * 1.5;
        const a = 0.05 + hash(i * 5.17) * 0.20;
        g.fillStyle = `rgba(230, 240, 255, ${a})`;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        if (hash(i * 7.7) < 0.18) {
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
      buildStreet();
      buildSpecks();
      streaks = Array.from({ length: 70 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 30 + Math.random() * 60,
        v: 500 + Math.random() * 500,
        a: 0.04 + Math.random() * 0.08,
      }));
      cars = [
        { x: Math.random() * w, v: 40 + Math.random() * 30, y: h * 0.60, red: false },
        { x: Math.random() * w, v: -(30 + Math.random() * 25), y: h * 0.64, red: true },
      ];
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

        if (street) ctx.drawImage(street, 0, 0);

        // проезжающие машины (размытые огни)
        for (const car of cars) {
          car.x += car.v * dt;
          if (car.x > w + 120) car.x = -120;
          if (car.x < -120) car.x = w + 120;
          const col = car.red ? [255, 90, 70] : [255, 230, 180];
          for (const off of [0, 26]) {
            const cx = car.x + (car.v > 0 ? off : -off);
            const cg = ctx.createRadialGradient(cx, car.y, 0, cx, car.y, 22);
            cg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.35)`);
            cg.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
            ctx.fillStyle = cg;
            ctx.beginPath(); ctx.arc(cx, car.y, 22, 0, Math.PI * 2); ctx.fill();
          }
        }

        // дождь на улице (штрихи)
        ctx.strokeStyle = "rgba(200, 215, 235, 1)";
        ctx.lineWidth = 1;
        for (const s of streaks) {
          s.y += s.v * dt;
          if (s.y > h + s.len) { s.y = -s.len; s.x = Math.random() * w; }
          ctx.globalAlpha = s.a;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.len * 0.06, s.y + s.len);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (specks) ctx.drawImage(specks, 0, 0);

        // тающие следы капель
        trailSpecks = trailSpecks.filter((t) => t.a > 0.01);
        for (const t of trailSpecks) {
          t.a -= dt * 0.10;
          ctx.fillStyle = `rgba(220, 235, 255, ${Math.max(0, t.a)})`;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
        }

        // стекающие капли
        if (drops.length < 24 && Math.random() < dt * 2.2) {
          drops.push({
            x: Math.random() * w,
            y: h * (0.05 + Math.random() * 0.5),
            r: 1.5 + Math.random() * 3.2,
            vy: 0,
            stick: 0.5 + Math.random() * 3.5,
            wob: Math.random() * Math.PI * 2,
            trail: 0,
          });
        }
        drops = drops.filter((d) => d.y < h * 0.9);
        for (const d of drops) {
          if (d.stick > 0) {
            d.stick -= dt;
          } else {
            d.vy += (30 + d.r * 45) * dt;
            d.y += d.vy * dt;
            d.x += Math.sin(time * 2.5 + d.wob) * 0.25;
            d.trail -= dt;
            if (d.trail <= 0) {
              trailSpecks.push({ x: d.x + (Math.random() - 0.5) * 1.5, y: d.y - d.r, r: d.r * (0.25 + Math.random() * 0.2), a: 0.30 });
              d.trail = 0.06 + Math.random() * 0.12;
            }
          }
          ctx.fillStyle = "rgba(215, 232, 255, 0.13)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r, d.r * 1.25, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.beginPath();
          ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.45, d.r * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }

        // рама: правая стойка + подоконник
        const fx = w * 0.80;
        const fw = Math.max(14, w * 0.028);
        const fg = ctx.createLinearGradient(fx, 0, fx + fw, 0);
        fg.addColorStop(0, "#241812");
        fg.addColorStop(0.5, "#3a2a1c");
        fg.addColorStop(1, "#1c120c");
        ctx.fillStyle = fg;
        ctx.fillRect(fx, 0, fw, h);
        ctx.fillStyle = "rgba(255, 215, 170, 0.07)";
        ctx.fillRect(fx - 1, 0, 2, h);

        const sy = h * 0.86;
        const sg = ctx.createLinearGradient(0, sy, 0, h);
        sg.addColorStop(0, "#2a1c12");
        sg.addColorStop(0.25, "#201409");
        sg.addColorStop(1, "#0e0804");
        ctx.fillStyle = sg;
        ctx.fillRect(0, sy, w, h - sy);
        ctx.fillStyle = "rgba(255, 200, 150, 0.10)";
        ctx.fillRect(0, sy, w, 2);

        // свеча с мерцанием
        const cx = w * 0.87, cy = h * 0.93;
        const flick = 0.75 + 0.20 * Math.sin(time * 7.3) + 0.08 * Math.sin(time * 15.7);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.22);
        glow.addColorStop(0, `rgba(255, 170, 80, ${0.28 * flick})`);
        glow.addColorStop(0.5, `rgba(255, 140, 60, ${0.10 * flick})`);
        glow.addColorStop(1, "rgba(255, 140, 60, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, h * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 200, 110, ${0.85 * flick})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy - h * 0.015, 3, 7 * flick, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 245, 210, 0.9)";
        ctx.beginPath();
        ctx.ellipse(cx, cy - h * 0.013, 1.4, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // чашка чая с паром
        const cupX = w * 0.62, cupY = sy + (h - sy) * 0.35;
        ctx.fillStyle = "#170d06";
        ctx.beginPath();
        ctx.ellipse(cupX, cupY, w * 0.035, (h - sy) * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 190, 130, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cupX, cupY - (h - sy) * 0.20, w * 0.030, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          for (let t2 = 0; t2 <= 1; t2 += 0.1) {
            const yy = cupY - (h - sy) * 0.3 - t2 * h * 0.08;
            const xx = cupX + Math.sin(t2 * 6 + time * 1.2 + i * 2) * 6 + (i - 0.5) * 10;
            if (t2 === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[RainScene] draw error:", err);
        ctx.globalCompositeOperation = "source-over";
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
