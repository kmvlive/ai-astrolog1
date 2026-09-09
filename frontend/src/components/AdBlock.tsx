"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ad {
  id: number;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  gradient_from: string;
  gradient_to: string;
  emoji: string;
}

interface Props {
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackCta?: string;
  fallbackUrl?: string;
}

export default function AdBlock({
  fallbackTitle = "Хотите персональный гороскоп?",
  fallbackDescription = "На основе вашей натальной карты — 10 планет, 12 домов, аспекты.",
  fallbackCta = "Создать аккаунт бесплатно",
  fallbackUrl = "/register",
}: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setIsLoggedIn(!!token);

    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/ads`)
        .then(r => r.ok ? r.json() : { ads: [] })
        .then(d => setAds(d.ads || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  // Не авторизован — показываем стандартный CTA
  if (!isLoggedIn) {
    return (
      <div className="mt-12 text-center p-8 rounded-3xl bg-gradient-to-r from-purple-900/30 to-amber-900/30 border border-white/10">
        <h3 className="text-2xl font-bold mb-3">{fallbackTitle}</h3>
        <p className="text-slate-400 mb-5">{fallbackDescription}</p>
        <Link
          href={fallbackUrl}
          className="inline-block px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition"
        >
          ✨ {fallbackCta}
        </Link>
      </div>
    );
  }

  // Авторизован, но рекламы нет — ничего не показываем
  if (ads.length === 0) return null;

  // Авторизован — показываем рекламу (берём первую активную)
  const ad = ads[0];

  return (
    <div className={`mt-12 text-center p-8 rounded-3xl bg-gradient-to-r ${ad.gradient_from} ${ad.gradient_to} border border-violet-500/30`}>
      <div className="text-4xl mb-3">{ad.emoji}</div>
      <h3 className="text-2xl font-bold mb-3">{ad.title}</h3>
      <p className="text-slate-300 mb-5 max-w-2xl mx-auto">{ad.description}</p>
      <Link
        href={ad.cta_url}
        className="inline-block px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition"
      >
        {ad.cta_text}
      </Link>
    </div>
  );
}
