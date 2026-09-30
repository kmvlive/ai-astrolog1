"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const SCENES = [
  { slug: "mountains", name: "Ночь в горах", emoji: "🏔️", free: true,  accent: "#38bdf8", desc: "Горные хребты, звёзды и луна над вершинами" },
  { slug: "sea",       name: "Ночь на море", emoji: "🌊", free: true, accent: "#34d399", desc: "Волны, лунная дорожка и бесконечный горизонт" },
  { slug: "space",     name: "Полёт в корабле", emoji: "🚀", free: true, accent: "#a855f7", desc: "Звёзды за иллюминатором, дрейф в глубоком космосе" },
  { slug: "earth",     name: "Земля из космоса", emoji: "🌍", free: true, accent: "#3b82f6", desc: "Вид на вращающуюся планету из глубокого космоса" },
  { slug: "galaxy",    name: "Галактика", emoji: "🌌", free: true, accent: "#8b5cf6", desc: "Вращающаяся спиральная галактика, мерцающие звёзды и кометы" },
  { slug: "starflight", name: "Полёт сквозь звёзды", emoji: "💫", free: true, accent: "#38bdf8", desc: "Гиперпрыжок: звёзды проносятся за иллюминаторами корабля" },
  { slug: "matrix",     name: "Матрица", emoji: "💊", free: true, accent: "#22c55e", desc: "Медленный поток символов: цифры и буквы стекают в темноте" },
  { slug: "code",       name: "Успокаивающий код", emoji: "💻", free: true, accent: "#61afef", desc: "Бесконечный набор кода с мягкой подсветкой синтаксиса" },
  { slug: "mandala",    name: "Мандала", emoji: "☸️", free: true, accent: "#c084fc", desc: "Вращающаяся симметрия: слои лепестков в медленном танце" },
  { slug: "sacred",     name: "Сакральная геометрия", emoji: "🕉️", free: true, accent: "#fbbf24", desc: "Цветок Жизни, куб Метатрона, спираль и икосаэдр" },
];

const PREMIUM_VERTICAL = [
  { slug: "koster", name: "Ночной костёр", emoji: "🔥", accent: "#f59e0b", desc: "Звуки ночного костра для глубокой медитации и спокойного сна", route: "/meditations/koster", free: true },
];

const PREMIUM_HORIZONTAL: Array<{ slug: string; name: string; emoji: string; accent: string; desc: string; route: string; free: boolean }> = [
  { slug: "rain", name: "Дождь за окном", emoji: "🌧️", accent: "#64748b", desc: "Капли стекают по стеклу, огни города тают в боке", route: "/meditations/rain", free: true },
];

const DURATIONS = [
  { v: 5,  label: "5 мин" },
  { v: 10, label: "10 мин" },
  { v: 15, label: "15 мин" },
  { v: 20, label: "20 мин" },
  { v: 0,  label: "Без лимита" },
];

export default function MeditationsPage() {
  const router = useRouter();
  const [sel, setSel] = useState<(typeof SCENES)[number] | null>(null);
  
  const [dur, setDur] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    const saved = localStorage.getItem("meditation_duration");
    if (!saved) return 10;
    const v = parseInt(saved, 10);
    return Number.isNaN(v) ? 10 : v;
  });

  const [sound, setSound] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meditation_sound");
      return saved !== null ? saved === "1" : true;
    }
    return true;
  });
  const [moon, setMoon] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meditation_moon");
      return saved !== null ? saved === "1" : true;
    }
    return true;
  });
  const isSubscribed = false;

  const start = () => {
    if (!sel) return;
    router.push(`/meditations/${sel.slug}?dur=${dur}&sound=${sound ? 1 : 0}&moon=${moon ? 1 : 0}`);
  };

  return (
    <main className="min-h-screen text-white relative">
      <SiteHeader />
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🧘</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Медитации под звёздами</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Погрузитесь в процедурно-сгенерированные пейзажи: горы, море или космос.
            Дышите, смотрите на звёзды и позвольте мыслям замедлиться.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {SCENES.map((s) => {
            const locked = !s.free && !isSubscribed;
            return (
              <button
                key={s.slug}
                onClick={() => !locked && setSel(s)}
                className={`relative rounded-2xl p-6 text-left border transition overflow-hidden ${
                  locked
                    ? "border-white/5 bg-slate-900/40 opacity-70 cursor-not-allowed"
                    : "border-white/10 bg-slate-900/70 hover:border-violet-500/40 hover:-translate-y-1"
                }`}
              >
                <div className="text-4xl mb-4">{s.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{s.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{s.desc}</p>
                {locked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
                    🔒 По подписке
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
                    {s.free ? "✓ Бесплатно" : "✓ В подписке"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="text-2xl">✨</span>
            <div className="h-px w-8 bg-amber-500/50" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-5xl md:text-6xl font-black tracking-wider mb-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]">
            ПРЕМИУМ
          </h2>
          <p className="text-slate-400 text-sm">Эксклюзивные медитации с живым видео и звуком</p>
        </div>

        {PREMIUM_VERTICAL.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h3 className="text-xl font-bold text-slate-200">Вертикальные</h3>
              <span className="text-xs text-slate-500 font-medium">для телефона</span>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {PREMIUM_VERTICAL.map((s) => {
                const locked = !s.free && !isSubscribed;
                return (
                  <button
                    key={s.slug}
                    onClick={() => !locked && router.push(s.route)}
                    disabled={locked}
                    className={`premium-card relative rounded-2xl p-6 text-left border transition overflow-hidden group ${
                      locked
                        ? "border-amber-500/10 bg-slate-900/40 opacity-70 cursor-not-allowed"
                        : "border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/70 to-slate-900/90 hover:border-amber-400/60 hover:-translate-y-1"
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-100 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full px-2 py-0.5 shadow-lg shadow-amber-500/30">
                        ⭐ Premium
                      </span>
                    </div>

                    <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">
                      {s.emoji}
                    </div>

                    <div className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                      {s.emoji}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">{s.name}</h3>
                    <p className="text-sm text-slate-300 mb-4 relative z-10">{s.desc}</p>

                    {locked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
                        🔒 По подписке
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-100 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-full px-3 py-1">
                        ▶ Открыть
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {PREMIUM_HORIZONTAL.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h3 className="text-xl font-bold text-slate-200">Горизонтальные</h3>
              <span className="text-xs text-slate-500 font-medium">для десктопа</span>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {PREMIUM_HORIZONTAL.map((s) => {
                const locked = !s.free && !isSubscribed;
                return (
                  <button
                    key={s.slug}
                    onClick={() => !locked && router.push(s.route)}
                    disabled={locked}
                    className={`premium-card relative rounded-2xl p-6 text-left border transition overflow-hidden group ${
                      locked
                        ? "border-amber-500/10 bg-slate-900/40 opacity-70 cursor-not-allowed"
                        : "border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/70 to-slate-900/90 hover:border-amber-400/60 hover:-translate-y-1"
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-100 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full px-2 py-0.5 shadow-lg shadow-amber-500/30">
                        ⭐ Premium
                      </span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">
                      {s.emoji}
                    </div>
                    <div className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                      {s.emoji}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">{s.name}</h3>
                    <p className="text-sm text-slate-300 mb-4 relative z-10">{s.desc}</p>
                    {locked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
                        🔒 По подписке
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-100 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-full px-3 py-1">
                        ▶ Открыть
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {sel && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSel(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">{sel.emoji} {sel.name}</h2>
            <p className="text-sm text-slate-400 mb-5">Настройте сессию под себя</p>

            <div className="mb-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Длительность</div>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.v}
                    onClick={() => {
                      setDur(d.v);
                      localStorage.setItem("meditation_duration", String(d.v));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                      dur === d.v
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button onClick={() => {
                const newSound = !sound;
                setSound(newSound);
                if (typeof window !== "undefined") {
                  localStorage.setItem("meditation_sound", newSound ? "1" : "0");
                }
              }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <span className="text-sm font-semibold">🔊 Звук</span>
                <span className={`text-sm font-bold ${sound ? "text-emerald-300" : "text-slate-500"}`}>{sound ? "Включён" : "Выключен"}</span>
              </button>
              <button onClick={() => {
                const newMoon = !moon;
                setMoon(newMoon);
                if (typeof window !== "undefined") {
                  localStorage.setItem("meditation_moon", newMoon ? "1" : "0");
                }
              }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <span className="text-sm font-semibold">🌙 По фазе луны</span>
                <span className={`text-sm font-bold ${moon ? "text-emerald-300" : "text-slate-500"}`}>{moon ? "Да" : "Нет"}</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSel(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition">Отмена</button>
              <button
                onClick={start}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition bg-violet-600 hover:bg-violet-500"
              >
                Начать →
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
