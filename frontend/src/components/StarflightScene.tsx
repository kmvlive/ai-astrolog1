"use client";

import { useEffect, useRef } from "react";

interface WarpStar {
  x: number; y: number; z: number; pz: number;
  cr: number; cg: number; cb: number;
}

export default function StarflightScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let interior: HTMLCanvasElement | null = null;

    // === Загрузка интерьера + хромокей magenta (иллюминаторы становятся прозрачными) ===
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/storage/space/starflight_interior.png?v=" + Date.now();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const g = c.getContext("2d", { willReadFrequently: true })!;
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height);
        const px = d.data;
        const W = c.width, H = c.height, n = W * H;
        // Мягкое условие: пурпурный/розовый (r и b заметно выше g) — ловит и #FF00FF и #A62679
        const isMagenta = (i: number) => {
          const r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2];
          return r > 110 && r - gg > 50 && b - gg > 30;
        };
        // Flood-fill: вырезаем ТОЛЬКО большие связные области (иллюминаторы),
        // мелкие розовые экранчики на пультах остаются
        const visited = new Uint8Array(n);
        let keyed = 0, windows = 0;
        for (let start = 0; start < n; start++) {
          if (visited[start] || !isMagenta(start)) continue;
          const stack = [start];
          visited[start] = 1;
          const comp: number[] = [];
          while (stack.length) {
            const i = stack.pop()!;
            comp.push(i);
            const x = i % W;
            for (const j of [i - 1, i + 1, i - W, i + W]) {
              if (j < 0 || j >= n) continue;
              if (x === 0 && j === i - 1) continue;
              if (x === W - 1 && j === i + 1) continue;
              if (!visited[j] && isMagenta(j)) { visited[j] = 1; stack.push(j); }
            }
          }
          if (comp.length > 3000) { // это иллюминатор, а не экранчик
            for (const i of comp) px[i * 4 + 3] = 0;
            keyed += comp.length;
            windows++;
          }
        }
        g.putImageData(d, 0, 0);
        
        // СИЛЬНОЕ сглаживание: размытие альфа-канала (box blur, 2 прохода)
        const d2 = g.getImageData(0, 0, W, H);
        const px2 = d2.data;
        const n2 = W * H;
        let a0 = new Float32Array(n2);
        let a1 = new Float32Array(n2);
        for (let i = 0; i < n2; i++) a0[i] = px2[i * 4 + 3];
        const R = 7; // радиус размытия — мягкий переход ~15px
        const win = 2 * R + 1;
        const blurH = (src: Float32Array, dst: Float32Array) => {
          for (let y = 0; y < H; y++) {
            let sum = 0;
            const row = y * W;
            for (let x = -R; x <= R; x++) sum += src[row + Math.min(W - 1, Math.max(0, x))];
            for (let x = 0; x < W; x++) {
              dst[row + x] = sum / win;
              sum += src[row + Math.min(W - 1, x + R + 1)] - src[row + Math.max(0, x - R)];
            }
          }
        };
        const blurV = (src: Float32Array, dst: Float32Array) => {
          for (let x = 0; x < W; x++) {
            let sum = 0;
            for (let y = -R; y <= R; y++) sum += src[Math.min(H - 1, Math.max(0, y)) * W + x];
            for (let y = 0; y < H; y++) {
              dst[y * W + x] = sum / win;
              sum += src[Math.min(H - 1, y + R + 1) * W + x] - src[Math.max(0, y - R) * W + x];
            }
          }
        };
        blurH(a0, a1); blurV(a1, a0); // проход 1
        blurH(a0, a1); blurV(a1, a0); // проход 2 — ещё мягче
        for (let i = 0; i < n2; i++) px2[i * 4 + 3] = Math.round(a0[i]);
        g.putImageData(d2, 0, 0);

        interior = c;
        console.log("[StarflightScene] вырезано иллюминаторов:", windows, "пикселей:", keyed);
      } catch (err) {
        console.error("[StarflightScene] ошибка хромокея:", err);
      }
    };
    img.onerror = () => {
      console.warn("[StarflightScene] интерьер не найден — показываю только звёзды");
    };

    // === Варп-звёзды (3D-поле, разлетаются из центра) ===
    const COUNT = 340;
    const SPEED = 0.55; // скорость гиперпрыжка
    let stars: WarpStar[] = [];

    const newStar = (full: boolean): WarpStar => {
      const roll = Math.random();
      let cr = 255, cg = 255, cb = 255;
      if (roll < 0.22) { cr = 180; cg = 210; cb = 255; }
      else if (roll < 0.34) { cr = 255; cg = 215; cb = 170; }
      return {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: full ? 0.05 + Math.random() * 0.95 : 1,
        pz: 1,
        cr, cg, cb,
      };
    };

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    stars = Array.from({ length: COUNT }, () => newStar(true));
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

        // Полупрозрачный фон → штрихи звёзд оставляют следы (motion blur)
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(4,4,12,0.45)";
        ctx.fillRect(0, 0, w, h);

        // === ВАРП-ЗВЁЗДЫ ===
        const cx = w / 2, cy = h / 2;
        const k = Math.max(w, h) * 0.55;
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (const s of stars) {
          s.pz = s.z;
          s.z -= SPEED * dt;
          if (s.z <= 0.02) {
            Object.assign(s, newStar(false));
            continue;
          }
          const sx = cx + (s.x / s.z) * k;
          const sy = cy + (s.y / s.z) * k;
          const pxp = cx + (s.x / s.pz) * k;
          const pyp = cy + (s.y / s.pz) * k;
          const near = 1 - s.z; // 0 далеко, 1 близко
          const alpha = Math.min(1, 0.15 + near * 1.1);
          ctx.strokeStyle = `rgba(${s.cr},${s.cg},${s.cb},${alpha})`;
          ctx.lineWidth = Math.max(0.6, near * 3.2);
          ctx.beginPath();
          ctx.moveTo(pxp, pyp);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        // === ЦЕНТРАЛЬНОЕ СВЕЧЕНИЕ (точка гиперпрыжка) ===
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.18);
        glow.addColorStop(0, "rgba(190,215,255,0.16)");
        glow.addColorStop(0.5, "rgba(140,170,255,0.06)");
        glow.addColorStop(1, "rgba(140,170,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * 0.18, 0, Math.PI * 2); ctx.fill();

        // === ИНТЕРЬЕР ПОВЕРХ (звёзды видны только в вырезанных иллюминаторах) ===
        ctx.globalCompositeOperation = "source-over";
        if (interior) {
          const s = Math.max(w / interior.width, h / interior.height);
          const dw = interior.width * s;
          const dh = interior.height * s;
          // интерьер статичен — летят только звёзды за иллюминаторами
          ctx.drawImage(interior, (w - dw) / 2, (h - dh) / 2, dw, dh);
        }

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[StarflightScene] draw error:", err);
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
