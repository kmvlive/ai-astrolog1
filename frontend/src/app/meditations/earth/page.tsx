"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export default function EarthMeditationPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden isolate text-white">
      <SiteHeader />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <Link href="/meditations" className="text-emerald-400 hover:text-emerald-300 mb-6 inline-block">
          ← Назад к медитациям
        </Link>

        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/30 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌍</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Заземление</h1>
            <p className="text-slate-400">Практика связи с Землёй для устойчивости и спокойствия</p>
            <div className="mt-4 text-emerald-400">⏱ 15 минут</div>
          </div>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4 text-emerald-300">О практике</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              Медитация заземления помогает восстановить связь с Землёй, обрести внутреннюю устойчивость и спокойствие. 
              Эта практика особенно полезна в моменты стресса, тревоги или когда вы чувствуете себя "оторванными от реальности".
            </p>

            <h2 className="text-2xl font-bold mb-4 text-emerald-300">Как выполнять</h2>
            <ol className="list-decimal list-inside space-y-3 text-slate-300">
              <li>Найдите удобное место, где вас никто не потревожит</li>
              <li>Сядьте или встаньте, чувствуя опору под ногами</li>
              <li>Закройте глаза и сделайте несколько глубоких вдохов</li>
              <li>Представьте, как из ваших стоп в землю уходят корни</li>
              <li>Почувствуйте, как земля даёт вам силу и устойчивость</li>
              <li>Останьтесь в этом состоянии 10-15 минут</li>
            </ol>

            <div className="mt-8 p-6 bg-emerald-950/50 border border-emerald-500/20 rounded-2xl">
              <h3 className="text-xl font-bold mb-2 text-emerald-300">💡 Совет</h3>
              <p className="text-slate-400 text-sm">
                Практикуйте заземление на свежем воздухе, босиком на траве или земле, для максимального эффекта.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/meditations"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition"
          >
            Все медитации
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
