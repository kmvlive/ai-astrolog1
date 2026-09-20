"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const COMPAT: Record<number, Record<number, string>> = {
  1: { 1: "Два лидера — борьба или партнёрство равных", 2: "Интуиция + воля = гармония", 3: "Творчество и изобилие" },
  2: { 1: "Интуиция + воля = гармония", 2: "Две жрицы — глубокая связь", 3: "Материнская забота" },
  3: { 1: "Творчество и изобилие", 2: "Материнская забота", 3: "Три императрицы — переизбыток" },
  4: { 1: "Император и Маг — союз силы", 2: "Структура + интуиция", 3: "Власть + изобилие" },
  5: { 1: "Традиции и инициатива", 2: "Мудрость и тайна", 3: "Учение через плодородие" },
  6: { 1: "Любовь и страсть", 2: "Чувства и интуиция", 3: "Романтика и изобилие" },
  7: { 1: "Победа и воля", 2: "Движение + тайна", 3: "Рост через победу" },
  8: { 1: "Сила + инициатива", 2: "Мягкость и мудрость", 3: "Забота и сила" },
  9: { 1: "Мудрость + действие", 2: "Две души в поиске", 3: "Уединение среди изобилия" },
  10: { 1: "Судьба и воля", 2: "Циклы и интуиция", 3: "Перемены в изобилии" },
  11: { 1: "Справедливость и сила", 2: "Истина и тайна", 3: "Баланс в любви" },
  12: { 1: "Жертва и действие", 2: "Пауза и мудрость", 3: "Новый взгляд на любовь" },
  13: { 1: "Трансформация и воля", 2: "Смерть и возрождение", 3: "Конец и новое начало" },
  14: { 1: "Гармония и сила", 2: "Баланс и тайна", 3: "Исцеление в любви" },
  15: { 1: "Искушение и воля", 2: "Тьма и свет", 3: "Страсть и плодородие" },
  16: { 1: "Разрушение и воля", 2: "Крах иллюзий", 3: "Освобождение от оков" },
  17: { 1: "Надежда и действие", 2: "Вера и мудрость", 3: "Вдохновение и любовь" },
  18: { 1: "Тайна и воля", 2: "Две луны", 3: "Иллюзии в любви" },
  19: { 1: "Радость и сила", 2: "Свет и мудрость", 3: "Солнце в любви" },
  20: { 1: "Призвание и воля", 2: "Пробуждение и тайна", 3: "Возрождение в любви" },
  21: { 1: "Завершение и сила", 2: "Целостность и мудрость", 3: "Мир в любви" },
  22: { 1: "Свобода и воля", 2: "Новое и тайна", 3: "Спонтанность в любви" },
};

function calcArcana(day: number, month: number, year: number): number {
  const sum = day + month + year;
  let n = sum;
  while (n > 22) {
    n = String(n).split("").reduce((a, b) => a + +b, 0);
  }
  return n || 22;
}

function bdToStr(bd: any): string {
  const d = new Date(bd);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return String(bd).slice(0, 10);
}

export default function CompatibilityPage() {
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [result, setResult] = useState<{ a1: number; a2: number; n1: string; n2: string; harmony: string } | null>(null);


  // Авто-подстановка даты рождения для авторизованных
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not auth"))))
      .then((d) => {
        const bd =
          d?.profile?.birth_date ??
          d?.user?.profile?.birth_date ??
          d?.birth_date;
        if (bd) setDate1(String(bd).slice(0, 10));
      })
      .catch(() => {});
  }, []);


  const handleCalc = () => {
    if (!date1 || !date2) return;
    const [y1, m1, d1] = date1.split("-").map(Number);
    const [y2, m2, d2] = date2.split("-").map(Number);
    const a1 = calcArcana(d1, m1, y1);
    const a2 = calcArcana(d2, m2, y2);
    const ARCANA_NAMES = ["","Маг","Жрица","Императрица","Император","Иерофант","Влюблённые","Колесница","Сила","Отшельник","Колесо Фортуны","Справедливость","Повешенный","Смерть","Умеренность","Дьявол","Башня","Звезда","Луна","Солнце","Суд","Мир","Шут"];
    const harmony = COMPAT[a1]?.[a2] || COMPAT[a2]?.[a1] || "Уникальная комбинация — исследуйте вместе свой путь";
    setResult({ a1, a2, n1: ARCANA_NAMES[a1], n2: ARCANA_NAMES[a2], harmony });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">
            Матрица совместимости
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Сравните арканы двух людей по датам рождения. Узнайте точки гармонии и зоны роста.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-pink-950/40 p-8 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Ваша дата рождения</label>
            <input type="date" value={date1} onChange={(e) => setDate1(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:border-pink-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Дата рождения партнёра</label>
            <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:border-pink-500 focus:outline-none" />
          </div>
          <button onClick={handleCalc} disabled={!date1 || !date2}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
            Проверить совместимость
          </button>
        </div>

        {result && (
          <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/60 to-slate-900/80 p-8 text-center">
            <div className="text-7xl mb-4">💞</div>
            <div className="flex justify-center items-center gap-8 mb-6">
              <div>
                <div className="text-sm text-pink-300">Ваш аркан</div>
                <div className="text-5xl font-bold text-white">{result.a1}</div>
                <div className="text-sm text-slate-400 mt-1">{result.n1}</div>
              </div>
              <div className="text-4xl text-pink-400">💕</div>
              <div>
                <div className="text-sm text-pink-300">Аркан партнёра</div>
                <div className="text-5xl font-bold text-white">{result.a2}</div>
                <div className="text-sm text-slate-400 mt-1">{result.n2}</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Гармония пары</h2>
            <p className="text-slate-300 leading-relaxed">{result.harmony}</p>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
