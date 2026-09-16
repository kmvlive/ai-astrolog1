"use client";

import { useMemo } from "react";

const COLORS = [
  "rgba(167, 139, 250, 0.9)",  // фиолетовый
  "rgba(96, 165, 250, 0.9)",   // синий
  "rgba(251, 191, 36, 0.9)",   // янтарный
  "rgba(244, 114, 182, 0.9)",  // розовый
  "rgba(52, 211, 153, 0.9)",   // изумрудный
  "rgba(255, 255, 255, 0.9)",  // белый
];

export default function CometField({ count = 10 }: { count?: number }) {
  const comets = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const reverse = Math.random() > 0.5;
      return {
        id: i,
        top: Math.random() * 85,
        left: reverse ? 60 + Math.random() * 40 : Math.random() * 40,
        angle: (reverse ? 180 : 0) + (Math.random() * 50 - 25),
        tail: 50 + Math.random() * 130,
        size: 2 + Math.random() * 3,
        dur: 4 + Math.random() * 8,
        delay: Math.random() * 15,
        dist: 40 + Math.random() * 60,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        op: 0.4 + Math.random() * 0.6,
        reverse,
      };
    });
  }, [count]);

  return (
    <div className="comet-field" aria-hidden="true">
      <div className="star-layer" />
      {comets.map((c) => (
        <span
          key={c.id}
          className="comet-r"
          style={{
            top: `${c.top}%`,
            left: `${c.left}%`,
            ["--angle" as any]: `${c.angle}deg`,
          } as React.CSSProperties}
        >
          <i
            className="comet-core"
            style={{
              width: c.size,
              height: c.size,
              ["--tail" as any]: `${c.tail}px`,
              ["--dur" as any]: `${c.dur}s`,
              ["--delay" as any]: `${c.delay}s`,
              ["--dist" as any]: `${c.dist}vw`,
              ["--glow" as any]: c.color,
              ["--op" as any]: c.op,
            } as React.CSSProperties}
          />
        </span>
      ))}
    </div>
  );
}
