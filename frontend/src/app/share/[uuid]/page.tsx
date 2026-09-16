import Link from "next/link";
import fs from "fs";
import path from "path";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdBlock from "@/components/AdBlock";

export const dynamic = "force-dynamic";

const INTERNAL = process.env.INTERNAL_API_URL || "http://host.docker.internal:8002";
const FALLBACK_INTERNAL = "http://backend:8002";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://my.neiro-astro.ru";

const TYPES: Record<string, { title: string; emoji: string; gradient: string; og: string }> = {
  "tarot-yes-no": { title: "Таро Да/Нет", emoji: "🃏", gradient: "from-violet-400 to-purple-400", og: "/og/tarot.png" },
  "celtic-cross": { title: "Кельтский крест", emoji: "✝️", gradient: "from-emerald-400 to-teal-400", og: "/og/tarot.png" },
  "tarot-love": { title: "Таро на любовь", emoji: "💕", gradient: "from-pink-400 to-rose-400", og: "/og/tarot.png" },
  "tarot-future": { title: "Таро на будущее", emoji: "🔮", gradient: "from-indigo-400 to-violet-400", og: "/og/crystal.png" },
  "tarot-birthdate": { title: "Таро по дате рождения", emoji: "⭐", gradient: "from-amber-400 to-yellow-400", og: "/og/crystal.png" },
  "coffee-grounds": { title: "На кофейной гуще", emoji: "☕", gradient: "from-amber-500 to-orange-400", og: "/og/coffee.png" },
  "runes": { title: "Гадание на рунах", emoji: "ᚱ", gradient: "from-sky-400 to-blue-400", og: "/og/runes.png" },
  "default": { title: "Предсказание", emoji: "🔮", gradient: "from-violet-400 to-purple-400", og: "/og/crystal.png" },
};

async function getData(uuid: string): Promise<any | null> {
  for (const url of [INTERNAL, FALLBACK_INTERNAL]) {
    try {
      const r = await fetch(`${url}/api/share/${uuid}`, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch {}
  }
  return null;
}

function ogImage(t: { og: string }) {
  const rel = t.og.replace(/^\//, "");
  try {
    if (fs.existsSync(path.join(process.cwd(), "public", rel))) {
      return `${SITE_URL}${t.og}`;
    }
  } catch {}
  return `${SITE_URL}/moon/moon-4.gif`;
}

export async function generateMetadata({ params }: any) {
  const p = await Promise.resolve(params);
  const d = await getData(p.uuid);
  const t = TYPES[d?.type] ?? TYPES.default;
  const desc = d ? d.prediction.replace(/\*\*/g, "").slice(0, 220) + "…" : "Предсказание AI-астролога";
  const title = `${t.emoji} ${t.title} — предсказание AI-астролога`;
  const image = ogImage(t);
  return {
    title, description: desc,
    openGraph: { title, description: desc, images: [{ url: image, width: 1200, height: 630, alt: t.title }], type: "article" },
    twitter: { card: "summary_large_image", title, description: desc, images: [image] },
    robots: { index: false, follow: true, "max-image-preview": "large" },
  };
}

function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (<>
    {parts.map((part, i) => i % 2 === 1
      ? <strong key={i} className="font-bold text-violet-200">{part}</strong>
      : <span key={i}>{part}</span>
    )}
  </>);
}

export default async function Page(props: any) {
  const params = await Promise.resolve(props.params);
  const d = await getData(params.uuid);
  const t = TYPES[d?.type] ?? TYPES.default;
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        {d ? (<>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{t.emoji}</div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r ${t.gradient} bg-clip-text text-transparent`}>{t.title}</h1>
            <div className="text-sm text-slate-500">Предсказание от {d.created_at}</div>
          </div>
          {d.question && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/70 border border-white/10 text-slate-300 text-sm">
              <span className="text-violet-300 font-semibold">Вопрос:</span> {d.question}
            </div>
          )}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-900/30 to-amber-900/20 border border-violet-500/20">
            <div className="text-xs uppercase tracking-wider text-violet-300 mb-3">✨ Предсказание</div>
            <div className="text-white text-lg leading-relaxed whitespace-pre-line"><Rich text={d.prediction} /></div>
          </div>
          <div className="text-center mt-8">
            <Link href={`/divinations/${d.type}`} className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-8 py-4 font-semibold transition shadow-lg shadow-violet-600/30">
              {t.emoji} Погадать тоже →
            </Link>
          </div>
        </>) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌫️</div>
            <h1 className="text-2xl font-bold mb-3">Предсказание не найдено</h1>
            <Link href="/divinations" className="text-violet-300 hover:text-violet-200">Выбрать гадание →</Link>
          </div>
        )}
        <div className="mt-10"><AdBlock /></div>
      </div>
      <SiteFooter />
    </main>
  );
}
