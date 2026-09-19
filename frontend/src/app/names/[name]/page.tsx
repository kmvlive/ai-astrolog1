import CometField from "@/components/CometField";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareBlock from "@/components/ShareBlock";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type NameData = {
  id: number;
  name: string;
  translit: string;
  interpretation: string;
  origin: string | null;
  image?: string | null;
  views: number;
  ai_generated: boolean;
  approved: boolean;
};

async function getName(translit: string): Promise<{ name: NameData; related: { by_origin: NameData[]; by_letter: NameData[] } } | null> {
  try {
    const r = await fetch(`${API_URL}/api/names/${translit}`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    const d = await r.json();
    return d || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const data = await getName(name);
  if (!data) return { title: "Имя не найдено — AI Астролог" };
  const nm = data.name;
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
  const data = await getName(name);
  if (!data) notFound();

  const nm = data.name;
  if (!nm) notFound();
  const related = data.related || {};
  const by_origin = related.by_origin || [];
  const by_letter = related.by_letter || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-violet-400">Главная</Link>
          <span className="mx-2">/</span>
          <Link href="/names" className="hover:text-violet-400">Значение имени</Link>
          <span className="mx-2">/</span>
          <span className="text-white capitalize">{nm.name}</span>
        </div>

        <div className="bg-gradient-to-br from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            {/* Картинка-персонаж в стиле колоды Таро */}
            {nm.image ? (
              <div className="relative group shrink-0">
                {/* Мягкое фиолетовое сияние-аура вокруг карты */}
                <div className="absolute -inset-10 rounded-[48px] bg-violet-600/25 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-700"></div>
                {/* Тонкая золотая окантовка-градиент (2px) */}
                <div className="relative rounded-[24px] p-[2px] bg-gradient-to-br from-amber-200/90 via-amber-500/40 to-amber-700/80 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.85),0_0_45px_-12px_rgba(251,191,36,0.35)]">
                  <div className="relative rounded-[22px] overflow-hidden bg-[#141024]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/storage/${nm.image}`}
                      alt={`Иллюстрация имени ${nm.name}`}
                      className="w-44 sm:w-60 h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      loading="eager"
                    />
                    {/* Блик, пробегающий по карте при наведении */}
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms]"></span>
                    {/* Внутренняя виньетка для глубины */}
                    <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_45px_rgba(8,5,26,0.55)]"></span>
                  </div>
                </div>
                {/* Тонкие золотые уголки-акценты */}
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-2 border-l-2 border-amber-300/90 rounded-tl-[10px]"></span>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-2 border-r-2 border-amber-300/90 rounded-tr-[10px]"></span>
                <span className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-2 border-l-2 border-amber-300/90 rounded-bl-[10px]"></span>
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-2 border-r-2 border-amber-300/90 rounded-br-[10px]"></span>
              </div>
            ) : (
              <div className="text-6xl mb-4">✨</div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Значение имени {nm.name}</h1>
              {nm.origin && (
                <p className="text-violet-300 text-sm">Происхождение: <span className="font-semibold capitalize">{nm.origin}</span></p>
              )}
            </div>
          </div>

          {/* Бейджи */}
          <div className="flex flex-wrap gap-2 mb-6">
            {nm.origin && (
              <span className="inline-flex items-center px-3 py-1 bg-emerald-600/30 border border-emerald-500/40 rounded-full text-xs font-semibold">
                🏛 {nm.origin}
              </span>
            )}
            {nm.ai_generated && (
              <span className="inline-block px-3 py-1 bg-violet-600/30 border border-violet-500/40 rounded-full text-xs font-semibold">
                ✨ AI-толкование
              </span>
            )}
          </div>

          <div className="text-lg text-slate-200 leading-relaxed mb-8 whitespace-pre-line">
            {nm.interpretation}
          </div>

          <ShareBlock title={`Значение имени ${nm.name} — происхождение и характер | AI Астролог`} />

          {/* Кнопка совместимости */}
          <div className="pt-6 border-t border-white/10">
            <Link
              href={`/names/compatibility?name1=${nm.translit}`}
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-500 px-6 py-2.5 rounded-xl font-semibold transition"
            >
              💕 Проверить совместимость с другим именем
            </Link>
          </div>
        </div>

        {/* Похожие по происхождению */}
        {by_origin.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {nm.origin ? `Имена ${nm.origin} происхождения` : "Похожие имена"}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {by_origin.map((n) => (
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

        {/* Имена на ту же букву */}
        {by_letter.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Имена на букву «{nm.name.charAt(0)}»
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {by_letter.map((n) => (
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

        <div className="text-center">
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
