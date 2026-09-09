"use client";

import { useEffect, useState } from "react";

type Props = { value: string; onChange: (v: string) => void };

export default function TimeInput({ value, onChange }: Props) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  useEffect(() => {
    const m = (value || "").match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      setHours(String(parseInt(m[1], 10)));
      setMinutes(String(parseInt(m[2], 10)));
    }
  }, [value]);

  const emit = (h: string, m: string) => {
    const hi = parseInt(h, 10), mi = parseInt(m, 10);
    if (hi >= 0 && hi <= 23 && mi >= 0 && mi <= 59) {
      onChange(`${String(hi).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const cls = "w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500 text-lg";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Часы</label>
        <input type="number" inputMode="numeric" min={0} max={23} placeholder="14" value={hours}
          onChange={(e) => { setHours(e.target.value); emit(e.target.value, minutes); }}
          className={cls} />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Минуты</label>
        <input type="number" inputMode="numeric" min={0} max={59} placeholder="30" value={minutes}
          onChange={(e) => { setMinutes(e.target.value); emit(hours, e.target.value); }}
          className={cls} />
      </div>
    </div>
  );
}
