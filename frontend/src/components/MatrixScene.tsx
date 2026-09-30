"use client";

import { useEffect, useRef } from "react";

const CHARS = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯабвгдежзиклмнопрстуфхцчшэюяABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-=<>?/*%&|^~!@#()[]{}:;,.\\\"";

interface Cell { ch: string; a: number; }
interface Col {
  x: number;
  head: number;
  cells: Cell[];
  timer: number;
  stepDur: number;
  flickCh: string;
  flickT: number;
  tailMode: number; // 0 — хвост горит, 1 — медленно тухнет
  holdMode: number; // 0 — сразу новый проход, 1 — держит собранный ряд и гаснет
  speed: number;    // индивидуальная скорость колонки (0.5x — 2x)
  state: "build" | "hold" | "dying" | "idle";
  stateT: number;
  fade: number;
}

export default function MatrixScene() {
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
    const FS = isMobile ? 12 : 13;   // символы мельче
    const COLW = isMobile ? 17 : 20; // колонки плотнее
    const ROWH = isMobile ? 17 : 18; // строк больше
    let cols: Col[] = [];
    let rows = 0;

    const rndCh = () => CHARS[Math.floor(Math.random() * CHARS.length)];

    const newCol = (x: number): Col => {
      const speed = 0.5 + Math.random() * 1.5; // у каждого ряда свой темп
      return {
        x,
        head: 0,
        cells: [],
        timer: 0,
        stepDur: (1.1 + Math.random() * 0.6) / speed,
        flickCh: rndCh(),
        flickT: 0,
        tailMode: Math.random() < 0.5 ? 0 : 1,
        holdMode: Math.random() < 0.5 ? 0 : 1,
        state: "build",
        stateT: 0,
        fade: 1,
        speed,
      };
    };

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      rows = Math.ceil(h / ROWH);
      const n = Math.ceil(w / COLW);
      cols = Array.from({ length: n }, (_, i) => newCol(i * COLW + COLW / 2));
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();

    const draw = () => {
      try {
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        ctx.font = `${FS}px monospace`;
        ctx.textAlign = "center";

        for (const col of cols) {
          if (col.state === "build") {
            col.timer += dt;
            col.flickT += dt;
            if (col.flickT > 0.09) { col.flickCh = rndCh(); col.flickT = 0; }
            if (col.timer >= col.stepDur) {
              col.cells[col.head] = { ch: rndCh(), a: 1 };
              col.head++;
              col.timer = 0;
              col.stepDur = (1.1 + Math.random() * 0.6) / col.speed;
              if (col.head >= rows) {
                col.state = col.holdMode === 1 ? "hold" : "idle";
                col.stateT = col.holdMode === 1 ? 2 + Math.random() * 3 : 0.01;
              } else if (Math.random() < 0.01) {
                col.state = "dying"; // случайно тухнет посреди построения
              }
            }
            if (col.tailMode === 1) {
              for (const cell of col.cells) if (cell) cell.a = Math.max(0, cell.a - dt * 0.06);
            }
          } else if (col.state === "hold") {
            col.stateT -= dt;
            if (col.tailMode === 1) for (const cell of col.cells) if (cell) cell.a = Math.max(0, cell.a - dt * 0.06);
            if (col.stateT <= 0) col.state = "dying";
          } else if (col.state === "dying") {
            col.fade = Math.max(0, col.fade - dt / 1.5);
            if (col.fade <= 0) { col.state = "idle"; col.stateT = 1 + Math.random() * 2.5; }
          } else {
            col.stateT -= dt;
            if (col.stateT <= 0) Object.assign(col, newCol(col.x));
          }

          // осевшие знаки — зелёные
          const fm = col.fade;
          if (fm > 0.01) {
            for (let i = 0; i < col.cells.length; i++) {
              const cell = col.cells[i];
              if (!cell || cell.a <= 0.02) continue;
              ctx.fillStyle = `rgba(0, 210, 90, ${Math.min(1, cell.a * fm * 0.85)})`;
              ctx.fillText(cell.ch, col.x, i * ROWH + ROWH);
            }
          }
          // голова ряда — салатовая вспышка с перебором + свечение
          if (col.state === "build" && col.head < rows) {
            ctx.save();
            ctx.shadowColor = "rgba(170, 255, 170, 0.9)";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "rgba(214, 255, 214, 0.95)";
            ctx.fillText(col.flickCh, col.x, col.head * ROWH + ROWH);
            ctx.restore();
          }
        }

        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[MatrixScene] draw error:", err);
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
