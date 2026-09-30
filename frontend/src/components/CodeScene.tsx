"use client";

import { useEffect, useRef } from "react";

interface Tok { t: string; c: string; }
interface Line { tokens: Tok[]; len: number; }

const C = {
  kw: "#c678dd",    // ключевые слова — фиолетовый
  fn: "#61afef",    // функции — синий
  str: "#98c379",   // строки — зелёный
  num: "#d19a66",   // числа — оранжевый
  com: "#5c6370",   // комментарии — серый
  id: "#e06c75",    // идентификаторы — красный
  plain: "#abb2bf", // скобки/точки — светлый
  op: "#56b6c2",    // операторы — бирюзовый
};

const IDS = ["data", "state", "value", "result", "user", "config", "matrix", "signal", "pulse", "orbit", "quantum", "neuron", "stream", "cache", "index", "count", "level", "phase", "wave", "field"];
const FNS = ["init", "parse", "render", "update", "compute", "normalize", "observe", "transform", "merge", "resolve", "breathe", "relax", "flow", "drift"];
const MODS = ["core", "mind", "cosmos", "dream", "ether", "nova"];
const COMMENTS = ["все спокойно", "просто дыши", "здесь и сейчас", "гармония", "поток мысли", "тишина внутри", "расслабься", "момент покоя", "наблюдай", "отпусти суету"];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function genLine(): Line {
  const t: Tok[] = [];
  const ind = "  ".repeat(Math.floor(Math.random() * 4));
  if (ind) t.push({ t: ind, c: C.plain });
  const r = Math.random();
  const id = () => pick(IDS);
  const fn = () => pick(FNS);
  const num = () => String(Math.floor(Math.random() * 99));
  if (r < 0.12) {
    t.push({ t: "// " + pick(COMMENTS), c: C.com });
  } else if (r < 0.30) {
    t.push({ t: pick(["const", "let"]), c: C.kw }, { t: " ", c: C.plain }, { t: id(), c: C.id }, { t: " = ", c: C.op }, { t: num(), c: C.num }, { t: ";", c: C.plain });
  } else if (r < 0.45) {
    t.push({ t: "function ", c: C.kw }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: id(), c: C.id }, { t: ") {", c: C.plain });
  } else if (r < 0.58) {
    t.push({ t: "if ", c: C.kw }, { t: "(", c: C.plain }, { t: id(), c: C.id }, { t: " > ", c: C.op }, { t: num(), c: C.num }, { t: ") {", c: C.plain });
  } else if (r < 0.70) {
    t.push({ t: "return ", c: C.kw }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: id(), c: C.id }, { t: ");", c: C.plain });
  } else if (r < 0.80) {
    t.push({ t: "await ", c: C.kw }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: `"${id()}"`, c: C.str }, { t: ");", c: C.plain });
  } else if (r < 0.88) {
    t.push({ t: "}", c: C.plain });
  } else if (r < 0.94) {
    t.push({ t: "import ", c: C.kw }, { t: "{ ", c: C.plain }, { t: id(), c: C.id }, { t: " } ", c: C.plain }, { t: "from ", c: C.kw }, { t: `'${pick(MODS)}'`, c: C.str }, { t: ";", c: C.plain });
  } else {
    t.push({ t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: num(), c: C.num }, { t: ", ", c: C.plain }, { t: `"${id()}"`, c: C.str }, { t: ");", c: C.plain });
  }
  const len = t.reduce((s, x) => s + x.t.length, 0);
  return { tokens: t, len };
}

export default function CodeScene() {
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
    const FS = isMobile ? 12 : 13;
    const LH = isMobile ? 19 : 22;
    const GUT = isMobile ? 34 : 46;
    let charW = 8;

    let lines: Line[] = [];
    let firstIndex = 1;
    let current: Line = genLine();
    let typed = 0;
    let speed = 18 + Math.random() * 8; // символов в секунду
    let pause = 0;
    let scroll = 0;
    let cursorT = 0;

    const resize = () => {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FS}px monospace`;
      charW = ctx.measureText("M").width;
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();

    const drawLine = (line: Line, y: number, maxChars: number | null, lineNo: number) => {
      // номер строки
      ctx.fillStyle = "#3a3f4a";
      ctx.textAlign = "right";
      ctx.fillText(String(lineNo), GUT - 10, y);
      ctx.textAlign = "left";
      // токены с подсветкой
      let left = maxChars === null ? line.len : maxChars;
      let x = GUT;
      let drawn = 0;
      for (const tok of line.tokens) {
        if (left <= 0) break;
        const part = tok.t.slice(0, left);
        ctx.fillStyle = tok.c;
        ctx.fillText(part, x, y);
        x += part.length * charW;
        drawn += part.length;
        left -= tok.t.length;
      }
      return drawn;
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
        ctx.font = `${FS}px monospace`;
        ctx.textBaseline = "middle";

        // набор символов
        if (pause > 0) {
          pause -= dt;
          if (pause <= 0) {
            lines.push(current);
            current = genLine();
            typed = 0;
            speed = 18 + Math.random() * 8;
          }
        } else {
          typed += speed * dt;
          if (typed >= current.len) {
            typed = current.len;
            pause = 0.4 + Math.random() * 0.9;
          }
        }

        // плавный автоскролл вниз
        const totalH = (lines.length + 1) * LH + LH * 2;
        const target = Math.max(0, totalH - h);
        scroll += (target - scroll) * Math.min(1, dt * 3);

        // убираем строки, ушедшие за верхний край
        while (scroll > LH * 2 && lines.length > 5) {
          lines.shift();
          firstIndex++;
          scroll -= LH;
        }

        // готовые строки
        for (let i = 0; i < lines.length; i++) {
          const y = LH + i * LH - scroll;
          if (y < -LH || y > h + LH) continue;
          drawLine(lines[i], y, null, firstIndex + i);
        }

        // текущая строка + курсор
        const yCur = LH + lines.length * LH - scroll;
        const drawn = drawLine(current, yCur, Math.floor(typed), firstIndex + lines.length);
        cursorT += dt;
        if (Math.sin(cursorT * 6) > -0.3) {
          const cx = GUT + drawn * charW;
          ctx.fillStyle = "rgba(180, 255, 180, 0.85)";
          ctx.fillRect(cx + 1, yCur - FS * 0.6, charW * 0.9, FS * 1.2);
        }
        // последний вставленный символ вспыхивает белым
        if (drawn > 0 && pause <= 0) {
          let left = drawn;
          let x = GUT;
          let lastPart = "";
          let lastX = GUT;
          for (const tok of current.tokens) {
            if (left <= 0) break;
            const part = tok.t.slice(0, left);
            lastPart = part[part.length - 1];
            lastX = x + (part.length - 1) * charW;
            x += part.length * charW;
            left -= tok.t.length;
          }
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.fillText(lastPart, lastX, yCur);
        }

        raf = requestAnimationFrame(draw);
      } catch (err) {
        console.error("[CodeScene] draw error:", err);
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
