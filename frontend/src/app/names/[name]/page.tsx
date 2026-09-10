import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type NameData = {
  id: number;
  name: string;
  translit: string;
  interpretation: string;
  views: number;
  ai_generated: boolean;
  approved: boolean;
};

async function getName(translit: string): Promise<NameData | null> {
  try {
    const r = await fetch(`${API_URL}/api/names/${translit}`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    const d = await r.json();
    return d.name || null;
  } catch {
    return null;
  }
}

async function getRelated(currentTranslit: string): Promise<NameData[]> {
  try {
    const r = await fetch(`${API_URL}/api/names`, { next: { revalidate: 60 } });
    const d = await r.json();
    return (d.names || []).filter((n: NameData) => n.translit !== currentTranslit).slice(0, 20);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const nm = await getName(name);
  if (!nm) return { title: "Имя не найдено — AI Астролог" };
  return {
    title: `Значение имени ${nm.name} — происхождение и характер | AI Астролог`,
    description: nm.interpretation.slice(0, 160),
    openGraph: {
      title: `✨ Значение имени ${nm.name}`,
      description: nm.interpretation.slice(0, 160),
      type: "article",
    },
  };
}

export default async function NameMeaningPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const nm = await getName(name);
  if (!nm) notFound();

  const related = await getRelated(nm.translit);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-violet-400">Главная</Link>
          <span className="mx-2">/</span>
          <Link href="/names" className="hover:text-violet-400">Значение имени</Link>
          <span className="mx-2">/</span>
          <span className="text-white capitalize">{nm.name}</span>
        </div>

        <div className="bg-gradient-to-br from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Значение имени {nm.name}</h1>
          <div className="text-lg text-slate-200 leading-relaxed mb-8 whitespace-pre-line">
            {nm.interpretation}
          </div>
          {nm.ai_generated && (
            <span className="inline-block px-3 py-1 bg-violet-600/30 border border-violet-500/40 rounded-full text-xs font-semibold">
              ✨ AI-толкование
            </span>
          )}
        </div>

        {/* Похожие имена */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Похожие имена</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {related.map((n) => (
                <Link
                  key={n.translit}
                  href={`/names/${n.translit}`}
                  className="p-3 bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-violet-500/40 rounded-xl transition text-center text-sm"
                >
                  {n.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/names"
            className="inline-block bg-violet-600 hover:bg-violet-500 px-6 py-2.5 rounded-xl font-semibold transition"
          >
            ← Все имена
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
