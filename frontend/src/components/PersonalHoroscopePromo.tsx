"use client";

import Link from "next/link";

export default function PersonalHoroscopePromo() {
  return (
    <div className="bg-gradient-to-br from-amber-900/30 via-purple-900/30 to-indigo-900/30 border border-amber-500/30 rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="text-5xl flex-shrink-0">💎</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-amber-200 mb-2">
            Персональный дневной гороскоп
          </h3>
          <p className="text-slate-300 mb-4 leading-relaxed">
            Общий гороскоп учитывает только знак зодиака. <strong className="text-white">Персональный</strong> строится 
            на вашей уникальной натальной карте — по дате, времени и месту рождения.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-slate-300">Положение всех планет в домах</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-slate-300">Аспекты и транзиты на сегодня</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-slate-300">Индивидуальные рекомендации</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span className="text-slate-300">Ежедневная доставка на email</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/pricing"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl px-6 py-3 font-bold text-center transition shadow-lg shadow-amber-500/20"
            >
              Оформить подписку — 299 ₽/мес
            </Link>
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Первые 3 дня бесплатно · Отмена в любой момент
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
