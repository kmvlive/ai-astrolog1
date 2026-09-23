"use client";

import { useEffect, useRef, useState } from "react";
import { drawStars, CometSystem, hash } from "@/lib/scenePaint";

interface Props {
  moonPhase?: number;
  hideInterior?: boolean;
}

const LAMP_POS = { x: 0.204, y: 0.744 };
const MONITOR_POS = { x: 0.895, y: 0.652 };

function projectEarth(tex: HTMLImageElement, rotation: number = 0): HTMLCanvasElement {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const g = c.getContext("2d")!;
  const tc = document.createElement("canvas");
  tc.width = tex.width; tc.height = tex.height;
  const tg = tc.getContext("2d", { willReadFrequently: true })!;
  tg.drawImage(tex, 0, 0);
  const td = tg.getImageData(0, 0, tc.width, tc.height).data;
  const out = g.createImageData(S, S);
  const od = out.data;
  const lon0 = rotation + 0.7;
  for (let y = 0; y < S; y++) {
    const ny = (y / S) * 2 - 1;
    for (let x = 0; x < S; x++) {
      const nx = (x / S) * 2 - 1;
      const i = (y * S + x) * 4;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) { od[i + 3] = 0; continue; }
      const z = Math.sqrt(1 - r2);
      const lat = Math.asin(-ny) - 0.55;
      const lon = lon0 + Math.atan2(nx, z);
      let u = lon / (2 * Math.PI) + 0.5;
      u = ((u % 1) + 1) % 1;
      const v = Math.max(0, Math.min(1, 0.5 - lat / Math.PI));
      const tx = Math.min(tc.width - 1, Math.floor(u * tc.width));
      const ty = Math.min(tc.height - 1, Math.floor(v * tc.height));
      const ti = (ty * tc.width + tx) * 4;
      const limb = 0.50 + 0.50 * Math.pow(z, 0.5);
      od[i] = td[ti] * limb;
      od[i + 1] = td[ti + 1] * limb;
      od[i + 2] = td[ti + 2] * limb;
      od[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}

export default function SpaceScene({ moonPhase = 4, hideInterior = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interiorRef = useRef<HTMLCanvasElement | null>(null);
  const earthImgRef = useRef<HTMLImageElement | null>(null);
  const lastProjRotRef = useRef<number>(-999);
  const earthProjRef = useRef<HTMLCanvasElement | null>(null);
  const [interiorLoaded, setInteriorLoaded] = useState(false);

    useEffect(() => {
    // 1. Загрузка Земли (всегда, независимо от hideInterior)
    const earthImg = new Image();
    earthImg.crossOrigin = "anonymous";
    earthImg.src = "/storage/space/earth_night.jpg?v=" + Date.now();
    console.log("[SpaceScene] Загружаю earth_night.jpg...");
    earthImg.onload = () => { 
      console.log("[SpaceScene] earth_night.jpg загружен, создаю проекцию...");
      earthImgRef.current = earthImg;
      earthProjRef.current = projectEarth(earthImg, 0);
      console.log("[SpaceScene] Проекция Земли создана");
    };
    earthImg.onerror = (err) => {
      console.error("[SpaceScene] ОШИБКА загрузки earth_night.jpg:", err);
    };

    // 2. Загрузка интерьера (только если НЕ hideInterior)
    if (hideInterior) {
      setInteriorLoaded(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/storage/space/interior.png?v=" + Date.now();
    
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const px = d.data;
      const W = c.width, H = c.height, n = W * H;

      const keyed = new Uint8Array(n);
      const stack: number[] = [];
      let totalKeyed = 0;
      const magentaPixels: number[] = [];
      for (let i = 0; i < n; i++) {
        const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
        if (r > 200 && g < 100 && b > 200) magentaPixels.push(i);
      }

      for (const startIdx of magentaPixels) {
        if (keyed[startIdx]) continue;
        const sr = px[startIdx * 4], sg = px[startIdx * 4 + 1], sb = px[startIdx * 4 + 2];
        stack.push(startIdx);
        keyed[startIdx] = 1;
        while (stack.length) {
          const i = stack.pop()!;
          const x = i % W;
          const ci = i * 4;
          if (Math.abs(px[ci] - sr) > 80 || Math.abs(px[ci + 1] - sg) > 80 || Math.abs(px[ci + 2] - sb) > 80) continue;
          px[ci + 3] = 0;
          keyed[i] = 1;
          totalKeyed++;
          for (const j of [i - 1, i + 1, i - W, i + W]) {
            if (j < 0 || j >= n) continue;
            if (x === 0 && j === i - 1) continue;
            if (x === W - 1 && j === i + 1) continue;
            if (!keyed[j]) { keyed[j] = 1; stack.push(j); }
          }
        }
      }

      let edgeCleaned = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (px[i * 4 + 3] === 0) continue;
          const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
          if (r - g < 25 || b - g < 25) continue;
          let nearTransparent = false;
          for (let dy = -10; dy <= 10 && !nearTransparent; dy++) {
            for (let dx = -10; dx <= 10 && !nearTransparent; dx++) {
              const xx = x + dx, yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
              if (px[(yy * W + xx) * 4 + 3] === 0) nearTransparent = true;
            }
          }
          if (nearTransparent) { px[i * 4 + 3] = 0; edgeCleaned++; }
        }
      }

      for (let i = 0; i < n; i++) {
        if (px[i * 4 + 3] === 0) continue;
        px[i * 4] *= 0.75;
        px[i * 4 + 1] *= 0.77;
        px[i * 4 + 2] *= 0.80;
      }
      
      ctx.putImageData(d, 0, 0);
      interiorRef.current = c;
      setInteriorLoaded(true);
    };
  }, [hideInterior]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let time = 0;
    const cometSys = new CometSystem();

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dt = 0.016;
      const base = Math.min(w, h);
      
      // Диагностика: выводим параметры раз в пару секунд, чтобы не спамить
      if (Math.floor(time) % 2 === 0 && Math.random() < 0.05) {
         console.log("[SpaceScene] draw работает:", { w, h, base, hideInterior, earthLoaded: !!earthProjRef.current });
      }
      
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "#020409";
      ctx.fillRect(0, 0, w, h);
      drawStars(ctx, w, h, time, h);

      // Если каюты нет, размещаем Землю по центру и делаем её красивой
      const R = hideInterior ? base * 0.85 : base * 1.15;
      const cx = w * 0.5 + Math.sin(time * 0.09) * base * 0.004;
      const cy = hideInterior ? h * 0.5 : h * 0.58 + R + Math.cos(time * 0.06) * base * 0.003;
      const surfaceRot = time * 0.02;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      if (earthImgRef.current) {
        // Пересчитываем проекцию только если вращение изменилось на ~0.02 рад
        // (иначе используем закэшированную — экономит CPU)
        if (Math.abs(surfaceRot - lastProjRotRef.current) > 0.02) {
          earthProjRef.current = projectEarth(earthImgRef.current, surfaceRot);
          lastProjRotRef.current = surfaceRot;
        }
        if (earthProjRef.current) {
          ctx.drawImage(earthProjRef.current, cx - R, cy - R, R * 2, R * 2);
        }
      } else {
        const disc = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.85, R * 0.1, cx, cy, R);
        disc.addColorStop(0, "#12305e");
        disc.addColorStop(1, "#050e22");
        ctx.fillStyle = disc;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
      ctx.restore();

      const rim = ctx.createRadialGradient(cx, cy, R * 0.975, cx, cy, R);
      rim.addColorStop(0, "rgba(90,160,255,0)");
      rim.addColorStop(1, "rgba(90,160,255,0.18)");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = rim;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
      
      const halo = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.09);
      halo.addColorStop(0, "rgba(90,160,255,0.14)");
      halo.addColorStop(1, "rgba(90,160,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "rgba(170,215,255,0.28)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      cometSys.update(ctx, w, h, time, dt);

      if (!hideInterior) {
        const interior = interiorRef.current;
        if (interior) {
        const s = Math.max(w / interior.width, h / interior.height);
        const dw = interior.width * s;
        const dh = interior.height * s;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(interior, dx, dy, dw, dh);

        // МЕРЦАНИЕ ЛАМПОЧКИ
        const lampX = dx + LAMP_POS.x * dw;
        const lampY = dy + LAMP_POS.y * dh;
        // Редкое случайное моргание (не чаще 1 раза в 20 сек)
                // Очень плавное, мягкое разжигание и потухание лампы
        const lampSmooth = (Math.sin(time * 0.2) + 1) / 2; // медленная волна 0..1, период ~31 сек
        const lampAlpha = 0.2 + 0.6 * lampSmooth; // мягко меняется от 0.2 до 0.8
        const glowRadius = base * 0.10;
        const glow = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, glowRadius);
        glow.addColorStop(0, `rgba(255, 230, 160, ${lampAlpha})`);
        glow.addColorStop(0.4, `rgba(255, 210, 120, ${lampAlpha * 0.6})`);
        glow.addColorStop(1, "rgba(255, 180, 80, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lampX, lampY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // МОРГАНИЕ МОНИТОРА
        const mx = dx + MONITOR_POS.x * dw;
        const my = dy + MONITOR_POS.y * dh;
        const blink = Math.sin(time * 0.25) > 0.97 ? 0.5 : 0;
        if (blink > 0) {
          const glow = ctx.createRadialGradient(mx, my, 0, mx, my, base * 0.05);
          glow.addColorStop(0, `rgba(150, 220, 255, ${blink})`);
          glow.addColorStop(1, "rgba(100, 200, 255, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(mx, my, base * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        }
      }

      // Диагностика: проверяем, что нарисовалось
      if (Math.floor(time) % 2 === 0 && Math.random() < 0.15) {
        console.log("[SpaceScene] Отрисовка:", {
          earthProj: !!earthProjRef.current,
          interior: !!interiorRef.current,
          hideInterior,
          R: R.toFixed(1),
          cx: cx.toFixed(1),
          cy: cy.toFixed(1),
          surfaceRot: surfaceRot.toFixed(3)
        });
      }
      
      time += dt;
      raf = requestAnimationFrame(draw);
    };

    // Интерактивный режим: клик показывает координаты
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      console.log(`[SpaceScene] Клик: x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
    };
    canvas.addEventListener("click", onClick);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
    };
  }, [moonPhase, interiorLoaded]);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
}
