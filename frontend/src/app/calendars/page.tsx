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

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
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
            <Link key={c.slug} href={`/calendars/${c.slug}`} className="group p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-violet-500/40 hover:bg-slate-900 transition shadow-lg">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{c.emoji}</div>
              <h2 className={`text-xl font-bold mb-2 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>{c.name}</h2>
              <p className="text-slate-400 text-sm mb-4">{c.short}</p>
              <div className="text-violet-300 text-sm font-semibold group-hover:text-violet-200">Открыть →</div>
            </Link>
          ))}
        </div>

        <div className="mt-10"><AdBlock /></div>
      </div>
      <SiteFooter />
    </main>
  );
}
