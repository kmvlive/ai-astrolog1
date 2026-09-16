import CometField from "@/components/CometField";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdBlock from "@/components/AdBlock";
import NameSearch from "@/components/NameSearch";
import { CALENDARS, getDayInfo, toKey } from "@/lib/calendars";

const ACCENTS: Record<string, string> = {
  holidays: "#f472b6",
  orthodox: "#fbbf24",
  muslim: "#34d399",
  lunar: "#a78bfa",
  gardener: "#4ade80",
  haircut: "#e879f9",
  names: "#38bdf8",
  conception: "#fb7185",
};

export function generateStaticParams() {
  return CALENDARS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: any) {
  const p = await Promise.resolve(params);
  const c = CALENDARS.find((x) => x.slug === p.slug);
  if (!c) return { title: "Календарь" };
  return { title: `${c.emoji} ${c.name} — на каждый день | AI Астролог`, description: c.short };
}

const MONTHS = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
const WD = ["пн","вт","ср","чт","пт","сб","вс"];

export default async function Page(props: any) {
  const params = await Promise.resolve(props.params);
  const sp = await Promise.resolve(props.searchParams);
  const c = CALENDARS.find((x) => x.slug === params.slug);
  if (!c) notFound();

  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth();
  if (typeof sp.m === "string") {
    const mm = sp.m.match(/^(\d{4})-(\d{2})$/);
    if (mm) { y = Number(mm[1]); m = Number(mm[2]) - 1; }
  }
  const prev = m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, "0")}`;
  const next = m === 11 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const curKey = `${y}-${String(m + 1).padStart(2, "0")}`;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(y, m, i + 1);
    return { n: i + 1, info: getDayInfo(c.slug, d), key: toKey(d) };
  });
  const notable = days.filter((d) => d.info.badge || d.info.rating === "good");

  const rateCls = (r?: string) =>
    r === "good" ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
    : r === "bad" ? "bg-rose-500/20 border-rose-400/40 text-rose-200"
    : "bg-slate-800/60 border-white/10 text-slate-300 hover:border-violet-500/40";

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300">Главная</Link>
          {" → "}
          <Link href="/calendars" className="hover:text-slate-300">Календари</Link>
          {" → "}
          <span className="text-slate-300">{c.name}</span>
        </div>

        <div
          className="cal-hero relative p-8 md:p-12 rounded-3xl mb-10 overflow-hidden"
          style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
        >
          <span className="cal-hero-watermark" aria-hidden="true">{c.emoji}</span>
          <div className="relative z-10">
            <div className="cal-hero-medal mb-4">
              <span className="text-4xl">{c.emoji}</span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>{c.name}</h1>
            <p className="text-slate-300 text-lg">{c.short}</p>
          </div>
        </div>

        <div className="cal-nav flex items-center justify-between gap-3 mb-8">
          <Link
            href={`/calendars/${c.slug}?m=${prev}`}
            style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
            className="cal-nav-btn group flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/60 border border-white/10 transition"
          >
            <span className="cal-nav-icon">←</span>
            <span className="cal-nav-label hidden sm:inline">{MONTHS[(m + 11) % 12]}</span>
          </Link>
          <div className="cal-nav-month text-xl md:text-2xl font-bold capitalize">
            {MONTHS[m]} <span className="text-slate-400">{y}</span>
          </div>
          <Link
            href={`/calendars/${c.slug}?m=${next}`}
            style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
            className="cal-nav-btn group flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/60 border border-white/10 transition"
          >
            <span className="cal-nav-label hidden sm:inline">{MONTHS[(m + 1) % 12]}</span>
            <span className="cal-nav-icon">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WD.map((w) => <div key={w} className="text-center text-xs text-slate-500 font-semibold py-1">{w}</div>)}
        </div>
        <div className="cal-grid grid grid-cols-7 gap-1.5 md:gap-2">
          {cells.map((n, i) =>
            n === null ? <div key={`e${i}`} /> : (
              <Link
                key={n}
                href={`/calendars/${c.slug}/${days[n - 1].key}`}
                title={days[n - 1].info.badge ?? undefined}
                style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
                className={`cal-day aspect-square flex flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${rateCls(days[n - 1].info.rating)} ${days[n - 1].key === toKey(new Date()) ? "cal-day-today" : ""}`}
              >
                <span className="cal-day-num">{n}</span>
                {days[n - 1].info.badge && <span className="cal-day-dot mt-0.5" />}
                {days[n - 1].key === toKey(new Date()) && <span className="cal-day-badge">Сегодня</span>}
              </Link>
            )
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-400/40" /> благоприятно</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-400/40" /> неблагоприятно</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> особая дата</span>
        </div>

        {notable.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">✨ Особые даты месяца</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {notable.map((d, idx) => (
                <Link
                  key={d.n}
                  href={`/calendars/${c.slug}/${d.key}`}
                  style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
                  className="cal-notable group relative p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden"
                >
                  <span className="cal-notable-shine" aria-hidden="true" />
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="cal-notable-date flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10">
                        <span className="text-lg font-bold">{d.n}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-300">{MONTHS[m]}</div>
                        <div className="text-xs text-amber-300 mt-0.5">Особая дата</div>
                      </div>
                    </div>
                    <div className="cal-notable-arrow">→</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Другие календари</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CALENDARS.filter((x) => x.slug !== c.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/calendars/${x.slug}?m=${curKey}`}
                style={{ ["--accent" as any]: ACCENTS[x.slug] || "#a78bfa" }}
                className="cal-mini group relative p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 text-center overflow-hidden"
              >
                <span className="cal-mini-shine" aria-hidden="true" />
                <div className="relative z-10">
                  <div className="text-3xl mb-2">{x.emoji}</div>
                  <div className="text-xs text-slate-300 font-medium">{x.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {c.slug === "names" && <div className="mt-8"><NameSearch /></div>}
        <div className="mt-10"><AdBlock /></div>
      </div>
      <SiteFooter />
    </main>
  );
}
