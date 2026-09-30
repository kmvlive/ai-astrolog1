"use client";

import { useEffect, useRef } from "react";

interface Tok { t: string; c: string; }
interface Line { tokens: Tok[]; len: number; }

const C = {
  kw: "#c678dd",
  fn: "#61afef",
  str: "#98c379",
  num: "#d19a66",
  com: "#5c6370",
  id: "#e06c75",
  plain: "#abb2bf",
  op: "#56b6c2",
};

const IDS = ["data", "state", "value", "result", "user", "config", "matrix", "signal", "pulse", "orbit", "quantum", "neuron", "stream", "cache", "index", "count", "level", "phase", "wave", "field"];
const FNS = ["init", "parse", "render", "update", "compute", "normalize", "observe", "transform", "merge", "resolve", "breathe", "relax", "flow", "drift"];
const MODS = ["core", "mind", "cosmos", "dream", "ether", "nova"];
const WORDS = ["поток", "гармония", "тишина", "космос", "ритм", "дыхание", "покой", "свет", "волна", "орбита", "рассвет", "глубина"];
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
  const word = () => pick(WORDS);
  if (r < 0.10) {
    t.push({ t: "// " + pick(COMMENTS) + " — " + pick(COMMENTS), c: C.com });
  } else if (r < 0.26) {
    t.push({ t: pick(["const", "let"]), c: C.kw }, { t: " ", c: C.plain }, { t: id(), c: C.id }, { t: " = ", c: C.op }, { t: "await ", c: C.kw }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: id(), c: C.id }, { t: ", ", c: C.plain }, { t: num(), c: C.num }, { t: `, "${word()}"`, c: C.str }, { t: ");", c: C.plain });
  } else if (r < 0.40) {
    t.push({ t: pick(["const", "let"]), c: C.kw }, { t: " ", c: C.plain }, { t: id(), c: C.id }, { t: " = ", c: C.op }, { t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: num(), c: C.num }, { t: ") + ", c: C.plain }, { t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: `("${word()}");`, c: C.str });
  } else if (r < 0.52) {
    t.push({ t: "function ", c: C.kw }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: id(), c: C.id }, { t: ", ", c: C.plain }, { t: id(), c: C.id }, { t: ") { ", c: C.plain }, { t: "return ", c: C.kw }, { t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: num(), c: C.num }, { t: `, "${word()}");`, c: C.str }, { t: " }", c: C.plain });
  } else if (r < 0.64) {
    t.push({ t: "if ", c: C.kw }, { t: "(", c: C.plain }, { t: id(), c: C.id }, { t: " > ", c: C.op }, { t: num(), c: C.num }, { t: " && ", c: C.op }, { t: id(), c: C.id }, { t: " !== ", c: C.op }, { t: `"${word()}"`, c: C.str }, { t: ") {", c: C.plain });
  } else if (r < 0.74) {
    t.push({ t: "for ", c: C.kw }, { t: "(let i = 0; i < ", c: C.plain }, { t: num(), c: C.num }, { t: "; i++) ", c: C.plain }, { t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: "(i, ", c: C.plain }, { t: `"${word()}"`, c: C.str }, { t: ");", c: C.plain });
  } else if (r < 0.84) {
    t.push({ t: "await ", c: C.kw }, { t: fn(), c: C.fn }, { t: "({ ", c: C.plain }, { t: "id", c: C.id }, { t: ": ", c: C.plain }, { t: `"${word()}"`, c: C.str }, { t: ", ", c: C.plain }, { t: "level", c: C.id }, { t: ": ", c: C.plain }, { t: num(), c: C.num }, { t: ", ", c: C.plain }, { t: "phase", c: C.id }, { t: ": ", c: C.plain }, { t: `"${word()}"`, c: C.str }, { t: " });", c: C.plain });
  } else if (r < 0.92) {
    t.push({ t: "import ", c: C.kw }, { t: "{ ", c: C.plain }, { t: id(), c: C.id }, { t: ", ", c: C.plain }, { t: id(), c: C.id }, { t: ", ", c: C.plain }, { t: id(), c: C.id }, { t: " } ", c: C.plain }, { t: "from ", c: C.kw }, { t: `'${pick(MODS)}/${pick(MODS)}';`, c: C.str });
  } else {
    t.push({ t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: "(", c: C.plain }, { t: num(), c: C.num }, { t: ", ", c: C.plain }, { t: `"${word()}"`, c: C.str }, { t: ").", c: C.plain }, { t: "then", c: C.fn }, { t: "((", c: C.plain }, { t: id(), c: C.id }, { t: ") => ", c: C.plain }, { t: id(), c: C.id }, { t: ".", c: C.plain }, { t: fn(), c: C.fn }, { t: "());", c: C.plain });
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
    let speed = 18 + Math.random() * 8;
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

    // Отрисовка фрагмента строки: skip — глобальный индекс начала, take — сколько символов
    const drawSeg = (line: Line, y: number, skip: number, take: number, showNo: number | null) => {
      if (showNo !== null) {
        ctx.fillStyle = "#3a3f4a";
        ctx.textAlign = "right";
        ctx.fillText(String(showNo), GUT - 10, y);
        ctx.textAlign = "left";
      }
      let consumed = 0;
      let drawn = 0;
      let lastCh = "";
      let lastX = GUT;
      for (const tok of line.tokens) {
        if (drawn >= take) break;
        const tokStart = consumed;
        consumed += tok.t.length;
        if (tokStart + tok.t.length <= skip) continue;
        const from = Math.max(0, skip - tokStart);
        const partLen = Math.min(tok.t.length - from, take - drawn);
        const part = tok.t.substr(from, partLen);
        const x = GUT + (tokStart + from - skip) * charW;
        ctx.fillStyle = tok.c;
        ctx.fillText(part, x, y);
        lastCh = part[partLen - 1];
        lastX = x + (partLen - 1) * charW;
        drawn += partLen;
      }
      return { drawn, lastCh, lastX };
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

        // переносы: сколько символов влезает в одну визуальную строку
        const mc = Math.max(20, Math.floor((w - GUT - 10) / charW));
        const visOf = (l: Line) => Math.max(1, Math.ceil(l.len / mc));

        // суммарная высота с учётом переносов
        let totalVis = visOf(current);
        for (const l of lines) totalVis += visOf(l);
        const totalH = totalVis * LH + LH * 3;
        const target = Math.max(0, totalH - h);
        scroll += (target - scroll) * Math.min(1, dt * 3);

        // убираем строки, ушедшие за верхний край (с учётом их переносов)
        while (scroll > LH * 2 && lines.length > 5) {
          const v0 = visOf(lines[0]);
          lines.shift();
          firstIndex++;
          scroll -= v0 * LH;
        }

        // готовые строки с переносами
        let yAcc = LH;
        for (let i = 0; i < lines.length; i++) {
          const vis = visOf(lines[i]);
          for (let v = 0; v < vis; v++) {
            const y = yAcc - scroll;
            if (y > -LH && y < h + LH) {
              drawSeg(lines[i], y, v * mc, mc, v === 0 ? firstIndex + i : null);
            }
            yAcc += LH;
          }
        }

        // текущая строка с переносами
        const typedChars = Math.min(current.len, Math.floor(typed));
        const visCur = visOf(current);
        const vc = Math.min(visCur - 1, Math.floor(typedChars / mc));
        let cursorX = GUT, cursorY = yAcc, flashCh = "", flashX = GUT;
        for (let v = 0; v < visCur; v++) {
          const y = yAcc - scroll;
          const take = Math.max(0, Math.min(mc, typedChars - v * mc));
          if (y > -LH && y < h + LH && take > 0) {
            const info = drawSeg(current, y, v * mc, take, v === 0 ? firstIndex + lines.length : null);
            if (v === vc) {
              flashCh = info.lastCh;
              flashX = info.lastX;
            }
          }
          if (v === vc) {
            cursorY = y;
            cursorX = GUT + (typedChars - vc * mc) * charW;
          }
          yAcc += LH;
        }

        // мигающий курсор
        cursorT += dt;
        if (Math.sin(cursorT * 6) > -0.3) {
          ctx.fillStyle = "rgba(180, 255, 180, 0.85)";
          ctx.fillRect(cursorX + 1, cursorY - FS * 0.6, charW * 0.9, FS * 1.2);
        }
        // последний вставленный символ вспыхивает белым
        if (flashCh && pause <= 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.fillText(flashCh, flashX, cursorY);
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
