"use client";

import { useEffect, useState } from "react";

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => CURRENT_YEAR - i);

function daysInMonth(m: number, y: number): number {
  if (m < 1 || m > 12) return 31;
  return new Date(y || CURRENT_YEAR, m, 0).getDate();
}

type Props = { value: string; onChange: (iso: string) => void };

export default function DateInput({ value, onChange }: Props) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    const m = (value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      setYear(String(parseInt(m[1], 10)));
      setMonth(String(parseInt(m[2], 10)));
      setDay(String(parseInt(m[3], 10)));
    }
  }, [value]);

  const maxDay = daysInMonth(parseInt(month, 10) || 0, parseInt(year, 10) || 0);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const emit = (d: string, m: string, y: string) => {
    const di = parseInt(d, 10), mi = parseInt(m, 10), yi = parseInt(y, 10);
    if (di >= 1 && mi >= 1 && mi <= 12 && yi >= 1920 && yi <= CURRENT_YEAR && di <= daysInMonth(mi, yi)) {
      onChange(`${yi}-${String(mi).padStart(2, "0")}-${String(di).padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const changeDay = (v: string) => { setDay(v); emit(v, month, year); };
  const changeMonth = (v: string) => {
    setMonth(v);
    let d = day;
    if (d && parseInt(d, 10) > daysInMonth(parseInt(v, 10) || 0, parseInt(year, 10) || 0)) {
      d = "";
      setDay("");
    }
    emit(d, v, year);
  };
  const changeYear = (v: string) => {
    setYear(v);
    let d = day;
    if (d && parseInt(d, 10) > daysInMonth(parseInt(month, 10) || 0, parseInt(v, 10) || 0)) {
      d = "";
      setDay("");
    }
    emit(d, month, v);
  };

  const cls = "w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500 text-lg";

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-sm text-slate-400 mb-1">День</label>
        <select value={day} onChange={(e) => changeDay(e.target.value)} className={cls}>
          <option value="">—</option>
          {days.map((d) => <option key={d} value={String(d)}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Месяц</label>
        <select value={month} onChange={(e) => changeMonth(e.target.value)} className={cls}>
          <option value="">—</option>
          {MONTHS.map((name, i) => <option key={i} value={String(i + 1)}>{name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Год</label>
        <select value={year} onChange={(e) => changeYear(e.target.value)} className={cls}>
          <option value="">—</option>
          {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}
