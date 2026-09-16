"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const SYNODIC = 29.53058867;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

type Phase = { name: string; emoji: string; img: string; text: string };

const PHASES: Phase[] = [
  { name: "Новолуние", emoji: "🌑", img: "/moon/moon-0.png", text: "Время новых начинаний. Загадайте намерение, запланируйте месяц и начните новое дело. Энергия на нуле — отдохните и не перегружайтесь." },
  { name: "Растущий серп", emoji: "🌒", img: "/moon/moon-1.png", text: "Энергия прибывает. Отличное время для старта планов, поиска ресурсов и первых шагов к цели. Смело действуйте." },
  { name: "Первая четверть", emoji: "🌓", img: "/moon/moon-2.png", text: "Луна набирает силу. Время действий: препятствия поддаются напору. Следите за словами — они быстро материализуются." },
  { name: "Растущая Луна", emoji: "🌔", img: "/moon/moon-3.png", text: "Энергия близка к пику. Завершайте начатое, договаривайтесь, заключайте сделки. Хороший период для работы в команде." },
  { name: "Полнолуние", emoji: "🌕", img: "/moon/moon-4.png", text: "Пик энергии и эмоций. Обострённая чувствительность и максимальная интуиция. Избегайте конфликтов, медитируйте и благодарите." },
  { name: "Убывающая Луна", emoji: "🌖", img: "/moon/moon-5.png", text: "Время делиться и завершать. Закрывайте задачи, отдавайте долги, наводите порядок в пространстве и мыслях." },
  { name: "Последняя четверть", emoji: "🌗", img: "/moon/moon-6.png", text: "Энергия идёт на спад. Период анализа, осмысления и отпускания лишнего. Не начинайте новое — завершайте старое." },
  { name: "Убывающий серп", emoji: "🌘", img: "/moon/moon-7.png", text: "Время тишины и обновления. Отдыхайте, медитируйте, подводите итоги. Организм нуждается в бережном отношении и сне." },
];

function getMoon(date: Date) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phase = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const idx = Math.floor((phase / SYNODIC) * 8 + 0.5) % 8;
  const illumination = Math.round(((1 - Math.cos((2 * Math.PI * phase) / SYNODIC)) / 2) * 100);
  const lunarDay = Math.floor(phase) + 1;
  return { idx, illumination, lunarDay };
}

export default function MoonPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <div className="text-center py-20 text-slate-400">Смотрим на Луну...</div>
      </main>
    );
  }

  const { idx, illumination, lunarDay } = getMoon(now);
  const p = PHASES[idx];
  const dateStr = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const url = typeof window !== "undefined" ? window.location.href : "https://my.neiro-astro.ru/moon";
  const text = `🌙 Луна ${dateStr}: ${p.name}, освещённость ${illumination}%. Что Луна советует сегодня?`;
  const eu = encodeURIComponent(url);
  const et = encodeURIComponent(text);

  const shares = [
    { name: "Telegram", href: `https://t.me/share/url?url=${eu}&text=${et}`, cls: "bg-sky-600 hover:bg-sky-500" },
    { name: "ВКонтакте", href: `https://vk.com/share.php?url=${eu}`, cls: "bg-blue-700 hover:bg-blue-600" },
    { name: "WhatsApp", href: `https://wa.me/?text=${et}%20${eu}`, cls: "bg-green-700 hover:bg-green-600" },
    { name: "Одноклассники", href: `https://connect.ok.ru/offer?url=${eu}`, cls: "bg-orange-700 hover:bg-orange-600" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-amber-300 bg-clip-text text-transparent">
            Фаза Луны сегодня
          </h1>
          <div className="text-lg text-slate-400">{dateStr}</div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-violet-500/30 shadow-2xl shadow-violet-900/40 mb-8">
          {/* Кометы */}
          <div className="moon-comets">
            <div className="comet comet-1" />
            <div className="comet comet-2" />
            <div className="comet comet-3" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.img} alt={`Луна: ${p.name}`} className="w-full h-auto relative z-0" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 to-transparent p-6">
            <div className="text-3xl font-bold">
              {p.emoji} {p.name}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 text-center">
            <div className="text-sm text-slate-400 mb-1">Освещённость</div>
            <div className="text-3xl font-bold text-amber-300">{illumination}%</div>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 text-center">
            <div className="text-sm text-slate-400 mb-1">Лунный день</div>
            <div className="text-3xl font-bold text-violet-300">{lunarDay}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-slate-900 border border-violet-500/20 p-6 mb-8">
          <div className="text-lg leading-relaxed text-slate-200">{p.text}</div>
        </div>

        <div className="text-center mb-4">
          <div className="text-lg font-semibold mb-4">Поделиться с друзьями</div>
          <div className="flex flex-wrap justify-center gap-3">
            {shares.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${s.cls}`}
              >
                {s.name}
              </a>
            ))}
            <button
              onClick={copy}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-white/10 transition"
            >
              {copied ? "✓ Скопировано" : "Скопировать ссылку"}
            </button>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/pricing" className="text-violet-400 hover:text-violet-300">
            Хотите персональный гороскоп на каждый день? → Выбрать тариф
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
