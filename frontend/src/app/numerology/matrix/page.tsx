"use client";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const ARCANA = [
  { n: 1, name: "Маг", meaning: "Сила воли, инициатива, творчество. Вы — создатель своей реальности." },
  { n: 2, name: "Жрица", meaning: "Интуиция, тайны, внутренняя мудрость. Доверяйте внутреннему голосу." },
  { n: 3, name: "Императрица", meaning: "Плодородие, изобилие, материнство. Время роста и процветания." },
  { n: 4, name: "Император", meaning: "Власть, структура, стабильность. Вы — лидер и защитник." },
  { n: 5, name: "Иерофант", meaning: "Традиции, учение, духовность. Время учиться и передавать знания." },
  { n: 6, name: "Влюблённые", meaning: "Выбор, гармония, отношения. Слушайте сердце." },
  { n: 7, name: "Колесница", meaning: "Победа, контроль, движение вперёд. Время действовать решительно." },
  { n: 8, name: "Сила", meaning: "Внутренняя сила, терпение, сострадание. Мягкость сильнее грубости." },
  { n: 9, name: "Отшельник", meaning: "Уединение, поиск истины, мудрость. Время для рефлексии." },
  { n: 10, name: "Колесо Фортуны", meaning: "Перемены, циклы, удача. Жизнь движется — примите поток." },
  { n: 11, name: "Справедливость", meaning: "Баланс, истина, карма. Время пожинать плоды." },
  { n: 12, name: "Повешенный", meaning: "Жертва, новый взгляд, пауза. Посмотрите на ситуацию иначе." },
  { n: 13, name: "Смерть", meaning: "Трансформация, конец и начало. Отпустите старое." },
  { n: 14, name: "Умеренность", meaning: "Баланс, терпение, исцеление. Время для гармонии." },
  { n: 15, name: "Дьявол", meaning: "Зависимости, материализм, искушение. Освободитесь от цепей." },
  { n: 16, name: "Башня", meaning: "Разрушение, откровение, освобождение. Крах иллюзий." },
  { n: 17, name: "Звезда", meaning: "Надежда, вдохновение, духовность. Верьте в лучшее." },
  { n: 18, name: "Луна", meaning: "Иллюзии, страхи, подсознание. Доверяйте интуиции." },
  { n: 19, name: "Солнце", meaning: "Радость, успех, жизненная сила. Время сиять." },
  { n: 20, name: "Суд", meaning: "Возрождение, призвание, пробуждение. Ответьте на зов." },
  { n: 21, name: "Мир", meaning: "Завершение, целостность, гармония. Вы достигли цели." },
  { n: 22, name: "Шут", meaning: "Новое начало, спонтанность, свобода. Шагните в неизвестность." },
];

function calcArcana(day: number, month: number, year: number): number {
  const sum = day + month + year;
  let n = sum;
  while (n > 22) {
    n = String(n).split("").reduce((a, b) => a + +b, 0);
  }
  return n || 22;
}

export default function MatrixPage() {
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<{ arcana: number; name: string; meaning: string } | null>(null);

  const handleCalc = () => {
    if (!birthDate) return;
    const [y, m, d] = birthDate.split("-").map(Number);
    const n = calcArcana(d, m, y);
    const a = ARCANA.find((x) => x.n === n)!;
    setResult({ arcana: n, name: a.name, meaning: a.meaning });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">
            Матрица судьбы
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Расчёт вашего главного аркана по дате рождения. Узнайте жизненный путь, таланты и кармические задачи.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-violet-950/40 p-8 mb-8">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Дата рождения</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:border-violet-500 focus:outline-none mb-4"
          />
          <button
            onClick={handleCalc}
            disabled={!birthDate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-violet-500 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            Рассчитать аркан
          </button>
        </div>

        {result && (
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-slate-900/80 p-8 text-center">
            <div className="text-7xl mb-4">🃏</div>
            <div className="text-sm text-violet-300 mb-2">Ваш аркан</div>
            <div className="text-5xl font-bold text-amber-400 mb-2">{result.arcana}</div>
            <h2 className="text-3xl font-bold text-white mb-4">{result.name}</h2>
            <p className="text-slate-300 leading-relaxed">{result.meaning}</p>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
