"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = "https://my.neiro-astro.ru";

const WIDGETS = [
  { type: "moon", js: "moon", title: "Фаза луны", desc: "Текущая фаза и лунный день", h: 170 },
  { type: "horoscope", js: "horoscope", title: "Общий гороскоп", desc: "С выбором знака зодиака", h: 260 },
  { type: "horoscope-daily", js: "horoscope", title: "Гороскоп сегодня/завтра", desc: "Знак + переключатель дня", h: 300 },
  { type: "affirmation", js: "affirmation", title: "Ежедневная аффирмация", desc: "Вдохновение дня", h: 190 },
  { type: "rune", js: "rune", title: "Руна дня", desc: "Карточка руны с советом", h: 230 },
  { type: "tarot", js: "tarot", title: "Карта Таро дня", desc: "Аркан дня с описанием", h: 220 },
  { type: "holidays", js: "holiday", title: "Праздники сегодня", desc: "Светские праздники дня", h: 210 },
  { type: "orthodox", js: "orthodox", title: "Православные праздники", desc: "Церковный календарь дня", h: 210 },
  { type: "lunar", js: "lunar", title: "Лунный календарь", desc: "Лунный день + рекомендация", h: 210 },
  { type: "garden", js: "garden", title: "Календарь садовода", desc: "Работы в саду по луне", h: 260 },
  { type: "nameday", js: "nameday", title: "Именины сегодня", desc: "Список имён дня", h: 190 },
  { type: "dreams", js: "dream", title: "Сонник", desc: "Поле ввода + толкование + ссылка", h: 260 },
];

export default function InformersPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const iframeCode = (w: (typeof WIDGETS)[0]) =>
    `<iframe src="${API}/embed/${w.type}" width="340" height="${w.h}" frameborder="0" loading="lazy" title="${w.title} — AI Астролог"></iframe>`;

  const jsCode = (w: (typeof WIDGETS)[0]) =>
    `<div class="neiro-astro-informer" data-type="${w.js}" data-theme="dark"></div>\n<script src="${API}/widgets/informer.js" defer><\/script>`;

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">📡</div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">
            Информеры и экспорт
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Служебный раздел. Два формата вставки: <b>iframe</b> (готовая карточка) и{" "}
            <b>JS-виджет</b> (вливается в чужой сайт, режимы card/inline, темы dark/light).
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {WIDGETS.map((w) => (
            <div key={w.type} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">{w.title}</h2>
                <span className="text-xs text-slate-500">{w.desc}</span>
              </div>

              {/* Превью */}
              <div className="rounded-xl overflow-hidden border border-white/10 mb-4 bg-[#0f0a1e]">
                <iframe
                  src={`${API}/embed/${w.type}`}
                  width="100%"
                  height={w.h}
                  frameBorder="0"
                  loading="lazy"
                  title={w.title}
                />
              </div>

              {/* Код iframe */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-violet-300">iframe</span>
                  <button
                    onClick={() => copy(iframeCode(w), `${w.type}-iframe`)}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                  >
                    {copied === `${w.type}-iframe` ? "✅ Скопировано" : "📋 Копировать"}
                  </button>
                </div>
                <pre className="text-[10px] text-slate-400 bg-slate-950/80 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {iframeCode(w)}
                </pre>
              </div>

              {/* Код JS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-amber-300">JS-виджет</span>
                  <button
                    onClick={() => copy(jsCode(w), `${w.type}-js`)}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                  >
                    {copied === `${w.type}-js` ? "✅ Скопировано" : "📋 Копировать"}
                  </button>
                </div>
                <pre className="text-[10px] text-slate-400 bg-slate-950/80 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {jsCode(w)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300 leading-relaxed">
          <h3 className="font-bold text-white mb-2">ℹ️ Опции JS-виджета</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-amber-300">data-mode="card|inline"</code> — карточка с рамкой или строка текста</li>
            <li><code className="text-amber-300">data-theme="dark|light"</code> — под тёмные и светлые сайты</li>
            <li><code className="text-amber-300">data-sign="aries…pisces"</code> — фиксированный знак для гороскопов</li>
            <li>Несколько виджетов на странице — один скрипт <code className="text-amber-300">informer.js</code></li>
          </ul>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
