import CometField from "@/components/CometField";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButtonsClient from "./ShareButtonsClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

// Транслитерация для URL
const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'',
    'э':'e','ю':'yu','я':'ya'
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('');
};

// Обратная транслитерация
const detransliterate = (text: string): string => {
  const map: Record<string, string> = {
    'a':'а','b':'б','v':'в','g':'г','d':'д','e':'е','yo':'ё','zh':'ж','z':'з','i':'и',
    'y':'й','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п','r':'р','s':'с','t':'т',
    'u':'у','f':'ф','kh':'х','ts':'ц','ch':'ч','sh':'ш','sch':'щ','yu':'ю','ya':'я'
  };
  const sorted = Object.keys(map).sort((a, b) => b.length - a.length);
  let result = text.toLowerCase();
  sorted.forEach(key => { result = result.split(key).join(map[key]); });
  return result;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

async function getSymbol(kw: string) {
  try {
    // params.keyword уже декодирован Next.js (App Router)
    const r = await fetch(`${API_URL}/api/dreams?q=${encodeURIComponent(kw)}`, { next: { revalidate: 60 } });
    const d = await r.json();
    const found = d.symbols?.find((s: any) => s.keyword.toLowerCase() === kw.toLowerCase());
    return found || null;
  } catch {
    return null;
  }
}

async function getRelated(kw: string) {
  try {
    const r = await fetch(`${API_URL}/api/dreams`, { next: { revalidate: 60 } });
    const d = await r.json();
    return (d.symbols || []).filter((s: any) => s.keyword.toLowerCase() !== kw.toLowerCase()).slice(0, 20);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { keyword: string } }): Promise<Metadata> {
  const sym = await getSymbol(params.keyword);
  if (!sym) return { title: "Символ не найден — Сонник | AI Астролог" };
  return {
    title: `К чему снится ${cap(sym.keyword)} — толкование сна | Сонник AI`,
    description: sym.interpretation,
    openGraph: {
      title: `🌙 К чему снится ${cap(sym.keyword)}`,
      description: sym.interpretation,
      type: "article",
    },
  };
}

export default async function DreamSymbolPage({ params }: { params: { keyword: string } }) {
  const sym = await getSymbol(params.keyword);
  if (!sym) notFound();

  const related = await getRelated(params.keyword);

  return (
    <main className="min-h-screen text-white relative overflow-hidden isolate">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-400 mb-6">
          <Link href="/dreams" className="hover:text-violet-400">🌙 Сонник</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{cap(sym.keyword)}</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-violet-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl mb-8">
          <div className="text-6xl mb-4">🌙</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">К чему снится {cap(sym.keyword)}</h1>
          <p className="text-lg text-slate-200 leading-relaxed mb-8">{sym.interpretation}</p>
          {sym.ai_generated && (
            <span className="inline-block px-3 py-1 bg-violet-600/30 border border-violet-500/40 rounded-full text-xs font-semibold mb-6">
              ✨ AI-толкование
            </span>
          )}
          <div className="pt-6 border-t border-white/10">
            <ShareButtonsClient title={`К чему снится ${cap(sym.keyword)}. ${sym.interpretation.slice(0, 100)}...`} />
          </div>
        </div>

        {related.length > 0 && (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4">Другие символы</h3>
            <div className="flex flex-wrap gap-2">
              {related.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/dreams/${encodeURIComponent(s.keyword)}`}
                  className="px-4 py-2 bg-slate-800 hover:bg-violet-900/40 border border-white/10 hover:border-violet-500/40 rounded-full text-sm transition"
                >
                  {s.keyword}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/dreams" className="text-violet-400 hover:text-violet-300">← Все символы</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
