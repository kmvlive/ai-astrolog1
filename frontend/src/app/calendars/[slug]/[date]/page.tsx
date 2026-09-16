import CometField from "@/components/CometField";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdBlock from "@/components/AdBlock";
import CalShare from "@/components/CalShare";
import { CALENDARS, getDayInfo, parseDate, fmtDate, toKey } from "@/lib/calendars";

const SITE = "https://my.neiro-astro.ru";
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

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

export async function generateMetadata({ params }: any) {
  const p = await Promise.resolve(params);
  const c = CALENDARS.find((x) => x.slug === p.slug);
  const d = parseDate(p.date);
  if (!c || !d) return { title: "Календарь" };
  const info = getDayInfo(c.slug, d as Date);
  const desc = info.blocks[0].t.replace(/\*\*/g, "").slice(0, 200);
  const title = `${c.emoji} ${c.name} на ${fmtDate(d)} | AI Астролог`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: [{ url: `${SITE}${c.og}`, width: 1200, height: 630, alt: c.name }], type: "article" },
    twitter: { card: "summary_large_image", title, description: desc, images: [`${SITE}${c.og}`] },
  };
}

function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (<>{parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-violet-200">{part}</strong> : <span key={i}>{part}</span>)}</>);
}

export default async function Page(props: any) {
  const params = await Promise.resolve(props.params);
  const c = CALENDARS.find((x) => x.slug === params.slug);
  const d = parseDate(params.date);
  if (!c || !d) notFound();

  const info = getDayInfo(c.slug, d as Date);
  const prev = new Date(d); prev.setDate(prev.getDate() - 1);
  const next = new Date(d); next.setDate(next.getDate() + 1);
  const url = `${SITE}/calendars/${c.slug}/${toKey(d)}`;
  const rateBadge = info.rating === "good"
    ? <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm">✅ благоприятный день</span>
    : info.rating === "bad"
    ? <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-sm">⛔ неблагоприятный день</span>
    : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300">Главная</Link>
          {" → "}
          <Link href="/calendars" className="hover:text-slate-300">Календари</Link>
          {" → "}
          <Link href={`/calendars/${c.slug}`} className="hover:text-slate-300">{c.name}</Link>
        </div>

        <div
          className="cal-date-hero relative p-8 md:p-12 rounded-3xl mb-10 overflow-hidden"
          style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
        >
          <span className="cal-date-watermark" aria-hidden="true">{c.emoji}</span>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="cal-date-medal mb-5">
              <span className="text-5xl">{c.emoji}</span>
            </div>
            <div className="cal-date-number mb-3">
              <span className="cal-date-day">{d.getDate()}</span>
              <div className="cal-date-month">{MONTHS_SHORT[d.getMonth()]}</div>
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
              {c.name} на {fmtDate(d)}
            </h1>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {info.badge && <span className="cal-date-badge-special">✨ {info.badge}</span>}
              {rateBadge}
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          {info.blocks.map((b, i) => (
            <div
              key={i}
              style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
              className="cal-date-block group relative p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden"
            >
              <span className="cal-date-block-shine" aria-hidden="true" />
              <div className="relative z-10">
                <div className="cal-date-block-label">{b.h}</div>
                <div className="text-white text-lg leading-relaxed whitespace-pre-line"><Rich text={b.t} /></div>
              </div>
            </div>
          ))}
        </div>

        <CalShare url={url} title={`${c.emoji} ${c.name} на ${fmtDate(d)}`} />

        <div className="flex justify-between gap-3 mt-10">
          <Link
            href={`/calendars/${c.slug}/${toKey(prev)}`}
            style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
            className="cal-date-nav group flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-900/60 border border-white/10 transition"
          >
            <span className="cal-date-nav-icon">←</span>
            <span className="cal-date-nav-label hidden sm:inline">Предыдущий день</span>
          </Link>
          <Link
            href={`/calendars/${c.slug}/${toKey(next)}`}
            style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
            className="cal-date-nav group flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-900/60 border border-white/10 transition"
          >
            <span className="cal-date-nav-label hidden sm:inline">Следующий день</span>
            <span className="cal-date-nav-icon">→</span>
          </Link>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Другие календари на эту дату</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CALENDARS.filter((x) => x.slug !== c.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/calendars/${x.slug}/${toKey(d)}`}
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

        <div className="mt-10"><AdBlock /></div>
      </div>
      <SiteFooter />
    </main>
  );
}
