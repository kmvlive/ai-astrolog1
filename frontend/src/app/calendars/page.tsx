import CometField from "@/components/CometField";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdBlock from "@/components/AdBlock";
import { CALENDARS } from "@/lib/calendars";

export const metadata = {
  title: "📅 Календари — праздники, лунные дни, посадка и стрижки | AI Астролог",
  description: "Календарь праздников, православный и мусульманский календари, лунный календарь, календарь садовода и стрижек — на каждый день.",
};

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

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Календари на каждый день
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Праздники, церковные даты, лунные сутки, благоприятные дни для сада и стрижки — всё в одном месте
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CALENDARS.map((c) => (
            <Link
              key={c.slug}
              href={`/calendars/${c.slug}`}
              style={{ ["--accent" as any]: ACCENTS[c.slug] || "#a78bfa" }}
              className="cal-card group relative p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 flex flex-col overflow-hidden"
            >
              <span className="cal-watermark" aria-hidden="true">{c.emoji}</span>
              <span className="cal-shine" aria-hidden="true" />
              <div className="cal-medal mb-4">
                <span className="cal-card-emoji text-3xl">{c.emoji}</span>
              </div>
              <h2 className={`text-xl font-bold mb-2 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>{c.name}</h2>
              <p className="text-slate-400 text-sm mb-5 flex-1">{c.short}</p>
              <div className="flex items-center justify-between">
                <span className="cal-card-arrow">Открыть</span>
                <span className="cal-go">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10"><AdBlock /></div>
      </div>
      <SiteFooter />
    </main>
  );
}
