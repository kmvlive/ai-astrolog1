"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

const typeNames: Record<string, string> = {
  love: "Любовный гороскоп",
  career: "Карьерный гороскоп",
  financial: "Финансовый гороскоп",
  health: "Гороскоп здоровья",
  chinese: "Китайский гороскоп",
  tibetan: "Тибетский гороскоп",
};

export default function HoroscopePage() {
  const { id } = useParams();
  const [horoscope, setHoroscope] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/horoscope/personal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHoroscope(data?.horoscope))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-4" />
          <div>Загрузка...</div>
        </div>
      </main>
    );
  }

  if (!horoscope) {
    return (
      <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="text-center py-20 text-slate-400">Гороскоп не найден</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/my-horoscopes" className="text-violet-400 hover:text-violet-300 mb-6 inline-block">
          ← Мои гороскопы
        </Link>

        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-1">
            {new Date(horoscope.created_at).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3 flex-wrap">
            {horoscope.type === "general"
              ? (horoscope.is_personal ? "Персональный гороскоп" : "Общий гороскоп")
              : (typeNames[horoscope.type] || horoscope.type)}
            {horoscope.is_personal && (
              <span className="text-sm px-3 py-1 rounded-full font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                ✨ персональный
              </span>
            )}
          </h1>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          {horoscope.content.split("\n\n").map((p: string, i: number) => (
            <p key={i} className="mb-4 text-slate-300 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
