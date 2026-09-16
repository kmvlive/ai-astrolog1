import CometField from "@/components/CometField";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdBlock from "@/components/AdBlock";
import CalShare from "@/components/CalShare";
import { CALENDARS, getDayInfo, parseDate, fmtDate, toKey } from "@/lib/calendars";

const SITE = "https://my.neiro-astro.ru";

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

        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{c.emoji}</div>
          <h1 className={`text-2xl md:text-4xl font-bold mb-3 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
            {c.name} на {fmtDate(d)}
          </h1>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {info.badge && <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm">✨ {info.badge}</span>}
            {rateBadge}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {info.blocks.map((b, i) => (
            <div key={i} className="p-6 rounded-3xl bg-gradient-to-br from-violet-900/25 to-slate-900/40 border border-violet-500/20">
              <div className="text-xs uppercase tracking-wider text-violet-300 mb-2">{b.h}</div>
              <div className="text-white text-lg leading-relaxed whitespace-pre-line"><Rich text={b.t} /></div>
            </div>
          ))}
        </div>

        <CalShare url={url} title={`${c.emoji} ${c.name} на ${fmtDate(d)}`} />

        <div className="flex justify-between mt-8">
          <Link href={`/calendars/${c.slug}/${toKey(prev)}`} className="px-4 py-2 rounded-xl bg-slate-800/80 border border-white/10 hover:border-violet-500/40 text-sm transition">← Предыдущий день</Link>
          <Link href={`/calendars/${c.slug}/${toKey(next)}`} className="px-4 py-2 rounded-xl bg-slate-800/80 border border-white/10 hover:border-violet-500/40 text-sm transition">Следующий день →</Link>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-bold mb-4 text-center">Другие календари на эту дату</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CALENDARS.filter((x) => x.slug !== c.slug).map((x) => (
              <Link key={x.slug} href={`/calendars/${x.slug}/${toKey(d)}`} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/20 text-center transition">
                <div className="text-2xl mb-1">{x.emoji}</div>
                <div className="text-xs text-slate-300">{x.name}</div>
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
