"use client";

type Pos = { name: string; value: number; arcana?: { name: string; image: string } | null };

const COORDS: Record<string, { x: number; y: number }> = {
  "1": { x: 200, y: 50 },
  "2": { x: 350, y: 200 },
  "3": { x: 200, y: 350 },
  "4": { x: 200, y: 200 },
  "5": { x: 50, y: 200 },
  "6": { x: 125, y: 125 },
  "7": { x: 275, y: 125 },
  "8": { x: 200, y: 275 },
};

export default function MatrixDiamond({
  positions,
  selected,
  onSelect,
}: {
  positions: Record<string, Pos>;
  selected: number | null;
  onSelect?: (n: number) => void;
}) {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <polygon points="200,50 350,200 200,350 50,200" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="2" />
      <line x1="200" y1="50" x2="200" y2="350" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
      <line x1="50" y1="200" x2="350" y2="200" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
      <line x1="125" y1="125" x2="275" y2="275" stroke="rgba(139,92,246,0.12)" strokeWidth="1" />
      <line x1="275" y1="125" x2="125" y2="275" stroke="rgba(139,92,246,0.12)" strokeWidth="1" />

      {Object.entries(positions).map(([num, pos]) => {
        const coords = COORDS[num];
        if (!coords) return null;
        const isSelected = selected === Number(num);
        return (
          <g
            key={num}
            onClick={() => onSelect?.(Number(num))}
            className={onSelect ? "cursor-pointer" : undefined}
          >
            <circle
              cx={coords.x}
              cy={coords.y}
              r={isSelected ? 34 : 29}
              fill={isSelected ? "rgba(251,191,36,0.22)" : "rgba(139,92,246,0.15)"}
              stroke={isSelected ? "#fbbf24" : "rgba(139,92,246,0.5)"}
              strokeWidth={isSelected ? 3 : 2}
            />
            <text x={coords.x} y={coords.y - 4} textAnchor="middle" fill="#fbbf24" fontSize="20" fontWeight="bold">
              {pos.value}
            </text>
            <text x={coords.x} y={coords.y + 14} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10">
              {pos.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
