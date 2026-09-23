"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

const meditations = [
  {
    slug: "earth",
    title: "Заземление",
    description: "Практика связи с Землёй для устойчивости и спокойствия",
    duration: "15 мин",
    emoji: "🌍",
    color: "emerald"
  }
];

const colorMap: Record<string, string> = {
  emerald: "from-emerald-900/40 to-teal-900/30 border-emerald-500/30 hover:border-emerald-500/60",
};

export default function MeditationsPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden isolate text-white">
      <SiteHeader />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-12">
          <div className="pricing-eyebrow mb-4">🧘 ПРАКТИКИ</div>
          <div className="cal-medal mx-auto mb-5" style={{ width: "84px", height: "84px", borderRadius: "26px", ["--accent" as any]: "#10b981" }}>
            <span className="text-4xl">🧘</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Медитации</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Звуки природы, космоса и практики для расслабления и гармонии</p>
        </div>

        <div className="space-y-4">
          {meditations.map((med) => (
            <Link
              key={med.slug}
              href={`/meditations/${med.slug}`}
              className={`block rounded-2xl p-6 bg-gradient-to-br ${colorMap[med.color]} border transition`}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">{med.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{med.title}</h3>
                  <p className="text-slate-400 text-sm">{med.description}</p>
                </div>
                <div className="text-sm text-emerald-400">{med.duration}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
