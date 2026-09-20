"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

const SIGN_BASE = "horoscopes";

function smartCut(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  let idx = -1;
  for (let i = cut.length - 1; i >= 0; i--) {
    if (".!?".includes(cut[i])) { idx = i; break; }
  }
  if (idx > limit * 0.5) return cut.slice(0, idx + 1);
  const sp = cut.lastIndexOf(" ");
  return cut.slice(0, sp > 0 ? sp : limit) + "…";
}

const LINK_TEXT: Record<string, string> = {
  moon: "Фазы луны",
  lunar: "Лунный календарь",
  affirmation: "Аффирмации дня",
  rune: "Руна дня и каталог рун",
  tarot: "Карта дня и расклады Таро",
  holidays: "Праздники сегодня",
  orthodox: "Православный календарь",
  garden: "Календарь садовода",
  nameday: "Именины и день ангела",
};

const LINKS: Record<string, string> = {
  moon: "/moon", lunar: "/moon",
  horoscope: "/horoscopes",
  affirmation: "/affirmations",
  rune: "/runes",
  tarot: "/tarot",
  holidays: "/calendars/holidays",
  orthodox: "/calendars/orthodox",
  garden: "/calendars/gardener",
  nameday: "/calendars/names",
  dreams: "/dreams",
};

const SIGNS = [
  { slug: "aries", name: "Овен" }, { slug: "taurus", name: "Телец" },
  { slug: "gemini", name: "Близнецы" }, { slug: "cancer", name: "Рак" },
  { slug: "leo", name: "Лев" }, { slug: "virgo", name: "Дева" },
  { slug: "libra", name: "Весы" }, { slug: "scorpio", name: "Скорпион" },
  { slug: "sagittarius", name: "Стрелец" }, { slug: "capricorn", name: "Козерог" },
  { slug: "aquarius", name: "Водолей" }, { slug: "pisces", name: "Рыбы" },
];

function Widget() {
  const params = useParams();
  const search = useSearchParams();
  const type = String(params.type || "moon");
  const apiType = type === "holidays" ? "holiday" : type === "dreams" ? "dream" : type === "horoscope-daily" ? "horoscope" : type;

  const [data, setData] = useState<any>(null);
  const [sign, setSign] = useState(search.get("sign") || "aries");
  const [period, setPeriod] = useState<"today" | "tomorrow">("today");
  const [dreamQ, setDreamQ] = useState("");
  const [dreamRes, setDreamRes] = useState<any>(null);

  useEffect(() => {
    const qs = apiType === "horoscope" ? `?sign=${sign}&period=${type === "horoscope-daily" ? period : "today"}` : "";
    fetch(`${API}/api/widgets/${apiType}${qs}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [apiType, sign, period, type]);

  const searchDream = async () => {
    if (!dreamQ.trim()) return;
    const r = await fetch(`${API}/api/widgets/dream?q=${encodeURIComponent(dreamQ)}`);
    setDreamRes(await r.json());
  };

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-[#e9e4f7] p-4 font-sans">
      <div className="max-w-[340px] mx-auto">
        {/* Фаза луны */}
        {type === "moon" && data && (
          <>
            <div className="font-bold text-lg mb-1">{data.phase}</div>
            <div className="text-sm opacity-80">{data.day}-й лунный день</div>
          </>
        )}

        {/* Лунный календарь */}
        {type === "lunar" && data && (
          <>
            <div className="text-3xl mb-2">{data.emoji}</div>
            <div className="font-bold text-lg mb-1">{data.day}-й лунный день</div>
            <div className="text-sm mb-2">{data.phase}</div>
            <div className="text-xs opacity-70 italic">{data.recommendation}</div>
          </>
        )}

        {/* Гороскоп */}
        {(type === "horoscope" || type === "horoscope-daily") && (
          <>
            <select
              value={sign}
              onChange={(e) => setSign(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-[#1a1430] border border-violet-500/40 text-sm text-[#e9e4f7]"
            >
              {SIGNS.map((s) => (
                <option key={s.slug} value={s.slug} className="bg-[#1a1430] text-[#e9e4f7]">
                  {s.name}
                </option>
              ))}
            </select>
            {type === "horoscope-daily" && (
              <div className="flex gap-2 mb-2">
                {(["today", "tomorrow"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${period === p ? "bg-violet-600" : "bg-white/10"}`}
                  >
                    {p === "today" ? "Сегодня" : "Завтра"}
                  </button>
                ))}
              </div>
            )}
            {data && (
              <>
                <div className="font-bold text-lg mb-1">{data.emoji} {data.sign_name}</div>
                <div className="text-sm leading-relaxed">{smartCut(String(data.text || ""), 700)}</div>
                <a
                  href={`${API}/${SIGN_BASE}/${data.sign_slug || sign}?utm_source=widget`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-amber-300 hover:text-amber-200"
                >
                  {data.emoji} Полный гороскоп: {data.sign_name} →
                </a>
              </>
            )}
          </>
        )}

        {/* Аффирмация */}
        {type === "affirmation" && data && (
          <>
            <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.08em] text-violet-300">
              <span className="text-2xl">💫</span>
              <span>Ежедневная аффирмация</span>
            </div>
            <div className="font-bold text-lg mb-2">{data.title}</div>
            {data.text && (
              <div className="text-sm opacity-80 italic">{smartCut(String(data.text), 300)}</div>
            )}
          </>
        )}

        {/* Руна дня */}
        {type === "rune" && data && (
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${API}/storage/${data.image}`} alt={data.name} className="w-20 rounded-lg border border-amber-400/50" />
            <div>
              <div className="font-bold text-lg">{data.name} <span className="text-amber-400">{data.glyph}</span></div>
              <div className="text-xs mt-1 leading-relaxed">{data.meaning}</div>
              <div className="text-xs opacity-70 italic mt-1">💡 {data.advice}</div>
            </div>
          </div>
        )}

        {/* Таро */}
        {type === "tarot" && data && (
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${API}/storage/${data.image}`} alt={data.name} className="w-20 aspect-[7/10] object-cover rounded-lg border border-amber-400/50" />
            <div>
              <div className="font-bold text-lg">🃏 {data.name}</div>
              <div className="text-xs mt-1 leading-relaxed">{smartCut(String(data.description || ""), 300)}</div>
            </div>
          </div>
        )}

        {/* Праздники / православные */}
        {(type === "holidays" || type === "orthodox") && data && (
          <>
            <div className="font-bold text-lg mb-2">{data.emoji} {data.date}</div>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {(data.holidays || []).map((h: any, i: number) => <li key={i}>{h.name}</li>)}
            </ul>
          </>
        )}

        {/* Садовод */}
        {type === "garden" && data && (
          <>
            <div className="font-bold text-lg mb-1">🌱 {data.title}</div>
            <div className="text-xs mb-2 leading-relaxed">{smartCut(String(data.text || ""), 250)}</div>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {(data.works || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          </>
        )}

        {/* Именины */}
        {type === "nameday" && data && (
          <>
            <div className="font-bold text-lg mb-2">🎂 Именины сегодня</div>
            <div className="text-sm leading-relaxed">{(data.names || []).join(", ")}</div>
          </>
        )}

        {/* Сонник */}
        {type === "dreams" && (
          <>
            <div className="font-bold text-lg mb-2">💭 Сонник</div>
            <input
              value={dreamQ}
              onChange={(e) => setDreamQ(e.target.value)}
              placeholder="Что приснилось? Например: вода"
              className="w-full px-3 py-2 rounded-lg bg-[#1a1430] border border-violet-500/40 text-sm text-[#e9e4f7] mb-2 placeholder:text-slate-500"
            />
            <button
              onClick={searchDream}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-violet-500 text-sm font-semibold"
            >
              🔍 Толковать
            </button>
            {dreamRes && (
              <div className="mt-3 text-xs space-y-2">
                {(dreamRes.results || []).length === 0 && <div className="opacity-70">Не найдено. Попробуйте другое слово.</div>}
                {(dreamRes.results || []).map((s: any, i: number) => (
                  <div key={i}>
                    • <b>{s.keyword || s.name}</b>
                    {(s.meaning || s.text) && <span> — {String(s.meaning || s.text).slice(0, 120)}…</span>}
                  </div>
                ))}
                {(dreamRes.results || []).length > 0 && (
                  <a href={`${API}/dreams?q=${encodeURIComponent(dreamQ)}`} target="_blank" rel="noopener noreferrer" className="block text-violet-300 mt-2">
                    Подробнее на AI Астролог →
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {/* Одна содержательная ссылка на раздел */}
        {LINK_TEXT[type] && (
          <a
            href={`${API}${LINKS[type]}?utm_source=widget`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-[11px] font-semibold text-violet-300 hover:text-violet-200"
          >
            {LINK_TEXT[type]} →
          </a>
        )}
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Загрузка…</div>}>
      <Widget />
    </Suspense>
  );
}
