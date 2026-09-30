"use client";

import { useEffect, useRef } from "react";

const PHI = (1 + Math.sqrt(5)) / 2;

export default function SacredGeometryScene() {
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

    // 4 сакральные фигуры, циклически сменяют друг друга
    const FIGURES = ["flower", "metatron", "spiral", "platonic"] as const;
    let figIdx = 0;
    let figT = 0;           // время внутри текущей фигуры
    const FIG_DUR = 18;     // секунд на фигуру
    const FADE_T = 2.5;     // fade in/out

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
    const R = () => Math.min(w, h) * 0.32;

    // ==== Фигура 1: Цветок Жизни ====
    const drawFlower = (progress: number) => {
      const r0 = R() * 0.35;
      const centers: [number, number][] = [[0, 0]];
      // 6 центров первого круга
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        centers.push([Math.cos(a) * r0, Math.sin(a) * r0]);
      }
      // второй круг (12 центров)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        centers.push([Math.cos(a) * r0 * 2, Math.sin(a) * r0 * 2]);
        const a2 = a + Math.PI / 6;
        centers.push([Math.cos(a2) * r0 * Math.sqrt(3), Math.sin(a2) * r0 * Math.sqrt(3)]);
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.03);
      ctx.strokeStyle = "rgba(255, 220, 150, 0.85)";
      ctx.shadowColor = "rgba(255, 210, 130, 0.7)";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.3;
      const n = Math.min(centers.length, Math.floor(progress * centers.length));
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(centers[i][0], centers[i][1], r0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    // ==== Фигура 2: Куб Метатрона ====
    const drawMetatron = (progress: number) => {
      const r0 = R() * 0.35;
      const centers: [number, number][] = [[0, 0]];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        centers.push([Math.cos(a) * r0, Math.sin(a) * r0]);
        centers.push([Math.cos(a) * r0 * 2, Math.sin(a) * r0 * 2]);
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-time * 0.02);

      // окружности
      ctx.strokeStyle = "rgba(200, 220, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(160, 200, 255, 0.6)";
      ctx.shadowBlur = 8;
      const nCirc = Math.min(centers.length, Math.floor(progress * centers.length));
      for (let i = 0; i < nCirc; i++) {
        ctx.beginPath();
        ctx.arc(centers[i][0], centers[i][1], r0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // линии между всеми центрами (появляются после окружностей)
      const lineP = Math.max(0, (progress - 0.4) / 0.6);
      if (lineP > 0) {
        ctx.strokeStyle = "rgba(255, 200, 230, 0.45)";
        ctx.shadowColor = "rgba(255, 180, 220, 0.5)";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 0.8;
        let k = 0;
        const totalPairs = (centers.length * (centers.length - 1)) / 2;
        const nLines = Math.floor(lineP * totalPairs);
        for (let i = 0; i < centers.length && k < nLines; i++) {
          for (let j = i + 1; j < centers.length && k < nLines; j++) {
            ctx.beginPath();
            ctx.moveTo(centers[i][0], centers[i][1]);
            ctx.lineTo(centers[j][0], centers[j][1]);
            ctx.stroke();
            k++;
          }
        }
      }
      ctx.restore();
    };

    // ==== Фигура 3: Золотая спираль ====
    const drawSpiral = (progress: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.08);
      ctx.strokeStyle = "rgba(255, 215, 140, 0.9)";
      ctx.shadowColor = "rgba(255, 200, 120, 0.8)";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.8;

      const turns = 5;
      const steps = 400;
      const maxT = turns * Math.PI * 2 * progress;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * maxT;
        if (t > maxT) break;
        const r = 4 * Math.pow(PHI, (t * 2) / Math.PI);
        const x = Math.cos(t) * r;
        const y = Math.sin(t) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // квадраты Фибоначчи тонкими линиями
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.6;
      let size = 4;
      let x = 0, y = 0;
      let dir = 0;
      for (let i = 0; i < Math.floor(progress * 12); i++) {
        const nextSize = size * PHI;
        ctx.strokeRect(x, y, size, size);
        if (dir === 0) { x -= nextSize - size; y -= nextSize - size; }
        else if (dir === 1) { y -= nextSize; }
        else if (dir === 2) { x += size; }
        else { y += size; }
        size = nextSize;
        dir = (dir + 1) % 4;
      }
      ctx.restore();
    };

    // ==== Фигура 4: Платоновы тела (проекция тетраэдр/октаэдр/икосаэдр) ====
    const drawPlatonic = (progress: number) => {
      // Вершины икосаэдра
      const verts: [number, number, number][] = [];
      for (const s1 of [-1, 1]) {
        for (const s2 of [-1, 1]) {
          verts.push([0, s1, s2 * PHI]);
          verts.push([s1, s2 * PHI, 0]);
          verts.push([s2 * PHI, 0, s1]);
        }
      }
      // Рёбра: все пары с расстоянием = 2
      const edges: [number, number][] = [];
      for (let i = 0; i < verts.length; i++) {
        for (let j = i + 1; j < verts.length; j++) {
          const dx = verts[i][0] - verts[j][0];
          const dy = verts[i][1] - verts[j][1];
          const dz = verts[i][2] - verts[j][2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (Math.abs(d2 - 4) < 0.1) edges.push([i, j]);
        }
      }

      const r0 = R() * 0.45;
      const rotY = time * 0.25;
      const rotX = time * 0.15;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      const projected: [number, number][] = verts.map(([x, y, z]) => {
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const depth = y * sinX + z1 * cosX;
        return [x1 * r0, y1 * r0];
      });

      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(180, 255, 220, 0.85)";
      ctx.shadowColor = "rgba(150, 255, 210, 0.7)";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.4;

      const nEdges = Math.floor(progress * edges.length);
      for (let i = 0; i < nEdges; i++) {
        const [a, b] = edges[i];
        ctx.beginPath();
        ctx.moveTo(projected[a][0], projected[a][1]);
        ctx.lineTo(projected[b][0], projected[b][1]);
        ctx.stroke();
      }

      // вершины точками
      ctx.fillStyle = "rgba(220, 255, 240, 0.95)";
      const nVerts = Math.floor(progress * projected.length);
      for (let i = 0; i < nVerts; i++) {
        ctx.beginPath();
        ctx.arc(projected[i][0], projected[i][1], 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = () => {
      try {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        // фоновые звёзды
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        for (let i = 0; i < (isMobile ? 30 : 60); i++) {
          const sx = Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * w;
          const sy = Math.abs(Math.sin(i * 78.233) * 12345.678 % 1) * h;
          const tw = 0.5 + 0.5 * Math.sin(time * 1.5 + i);
          ctx.globalAlpha = tw * 0.5;
          ctx.fillRect(sx, sy, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;

        figT += dt;
        if (figT > FIG_DUR) { figT = 0; figIdx = (figIdx + 1) % FIGURES.length; }
        // progress: 0..FADE_T — рост; FADE_T..FIG_DUR-FADE_T — 1; далее — падение
        let alpha = 1;
        let build = 1;
        if (figT < FADE_T) {
          alpha = figT / FADE_T;
          build = alpha;
        } else if (figT > FIG_DUR - FADE_T) {
          alpha = (FIG_DUR - figT) / FADE_T;
        }

        ctx.globalAlpha = alpha;
        const fig = FIGURES[figIdx];
        if (fig === "flower") drawFlower(build);
        else if (fig === "metatron") drawMetatron(build);
        else if (fig === "spiral") drawSpiral(build);
        else if (fig === "platonic") drawPlatonic(build);
        ctx.globalAlpha = 1;

        // подпись фигуры
        const names: Record<string, string> = {
          flower: "Цветок Жизни",
          metatron: "Куб Метатрона",
          spiral: "Золотая спираль",
          platonic: "Икосаэдр",
        };
        const fadeIn = Math.min(1, alpha);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * fadeIn})`;
        ctx.font = `${isMobile ? 14 : 16}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;
        ctx.fillText(names[fig], cx, h - 40);

        time += dt;
        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[SacredGeometryScene]", err);
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
