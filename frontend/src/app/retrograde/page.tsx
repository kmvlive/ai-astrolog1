"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButtons from "@/components/ShareButtons";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Planet {
  key: string;
  name: string;
  glyph: string;
  is_retrograde: boolean;
  daily_motion_arcmin: number;
  period_start?: string | null;
  period_end?: string | null;
  next_start?: string | null;
  next_end?: string | null;
}

const PLANET_DESCRIPTIONS: Record<string, { meaning: string; retro: string; direct: string }> = {
  mercury: {
    meaning: "Коммуникация, мышление, поездки, договоры",
    retro: "Пересматривайте планы, проверяйте документы, возможны задержки в коммуникации. Хорошее время для исправления ошибок и завершения старых дел.",
    direct: "Ясность мышления, успешные переговоры, быстрая коммуникация. Идеальное время для новых проектов и важных решений.",
  },
  venus: {
    meaning: "Любовь, отношения, финансы, творчество",
    retro: "Возвращаются прошлые отношения или чувства. Пересмотрите ценности и бюджет. Не время для новых романов.",
    direct: "Гармония в отношениях, финансовые успехи, творческий подъём. Отличное время для свиданий и покупок.",
  },
  mars: {
    meaning: "Энергия, действие, конфликты, спорт",
    retro: "Энергия направлена внутрь. Возможна апатия или раздражительность. Отложите активные начинания.",
    direct: "Высокая энергия, решительность, успех в соревнованиях. Время действовать и достигать целей.",
  },
  jupiter: {
    meaning: "Удача, расширение, образование, путешествия",
    retro: "Пересмотр убеждений и планов. Возвращение к старым идеям. Не время для масштабных проектов.",
    direct: "Рост, новые возможности, успешное обучение и путешествия. Время расширять горизонты.",
  },
  saturn: {
    meaning: "Дисциплина, ответственность, структура, ограничения",
    retro: "Пересмотр долгосрочных целей и обязательств. Проверка на прочность ваших достижений.",
    direct: "Стабильность, дисциплина, признание заслуг. Время строить фундамент будущего.",
  },
  uranus: {
    meaning: "Неожиданности, свобода, инновации, перемены",
    retro: "Внутренние озарения, пересмотр взглядов на свободу. Неожиданные идеи из прошлого.",
    direct: "Внезапные перемены, инсайты, освобождение от старого. Время революционных решений.",
  },
  neptune: {
    meaning: "Интуиция, мечты, творчество, духовность",
    retro: "Усиление интуиции, но возможна путаница. Время для медитации и внутренней работы.",
    direct: "Творческий подъём, духовные прозрения, вдохновение. Идеально для искусства.",
  },
  pluto: {
    meaning: "Трансформация, власть, глубокие изменения",
    retro: "Глубокая внутренняя трансформация, переработка прошлого. Время для психотерапии.",
    direct: "Мощные перемены, освобождение от старого, обретение силы. Время перерождения.",
  },
};

export default function RetrogradePage() {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/retrograde`)
      .then((r) => r.json())
      .then((data) => {
        setPlanets(data.planets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const retro = planets.filter((p) => p.is_retrograde);
  const direct = planets.filter((p) => !p.is_retrograde);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-800 rounded w-3/4"></div>
            <div className="h-6 bg-slate-800 rounded w-full"></div>
            <div className="h-6 bg-slate-800 rounded w-2/3"></div>
          </div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            ☿ Ретроградные планеты
          </h1>
          <p className="text-lg text-slate-400">
            Ретроградное движение — это оптическая иллюзия, когда планета кажется движущейся назад относительно звёзд.
            В астрологии это время для пересмотра, завершения и внутренней работы.
          </p>
        </div>

        {retro.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-red-400">🔴 Сейчас ретроградны</h2>
            <div className="space-y-4">
              {retro.map((p) => (
                <div
                  key={p.key}
                  className="bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 rounded-2xl p-6 cursor-pointer hover:border-red-500/50 transition"
                  onClick={() => setSelectedPlanet(selectedPlanet === p.key ? null : p.key)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{p.glyph}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{p.name}</h3>
                        <p className="text-sm text-slate-400">
                          {PLANET_DESCRIPTIONS[p.key]?.meaning}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-red-300 mb-1">
                        {p.period_start && p.period_end && (
                          <>
                            {new Date(p.period_start).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} —{" "}
                            {new Date(p.period_end).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">Скорость: {p.daily_motion_arcmin}' / день</div>
                    </div>
                  </div>

                  {selectedPlanet === p.key && (
                    <div className="mt-4 pt-4 border-t border-red-500/20">
                      <p className="text-slate-300 leading-relaxed">
                        {PLANET_DESCRIPTIONS[p.key]?.retro}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mt-2">
                    {selectedPlanet === p.key ? "Нажмите чтобы свернуть" : "Нажмите для подробностей"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {direct.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-green-400">🟢 Директные планеты</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {direct.map((p) => (
                <div
                  key={p.key}
                  className="bg-gradient-to-br from-green-950/30 to-slate-900 border border-green-500/20 rounded-xl p-4 cursor-pointer hover:border-green-500/40 transition"
                  onClick={() => setSelectedPlanet(selectedPlanet === p.key ? null : p.key)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{p.glyph}</span>
                    <h3 className="font-semibold text-white">{p.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    {PLANET_DESCRIPTIONS[p.key]?.meaning}
                  </p>
                  {p.next_start && (
                    <p className="text-xs text-slate-500">
                      Следующий ретроград: {new Date(p.next_start).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}

                  {selectedPlanet === p.key && (
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {PLANET_DESCRIPTIONS[p.key]?.direct}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-violet-950/30 border border-violet-500/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-3 text-violet-300">💡 Совет астролога</h3>
          <p className="text-slate-300 leading-relaxed">
            Периоды ретроградности — это не "плохое время", а возможность пересмотреть и улучшить.
            Используйте это время для завершения начатого, исправления ошибок и глубокой внутренней работы.
            Когда планета возвращается в директное движение — наступает время действий и новых начинаний.
          </p>
        </div>


        <ShareButtons
          title="Поделиться с друзьями"
          text="☿ Ретроградные планеты — узнайте какие планеты сейчас в ретрограде и как это влияет на вашу жизнь"
          className="mt-8"
        />

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition"
          >
            ← На главную
          </Link>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
