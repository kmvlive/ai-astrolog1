"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

interface Affirmation {
  id: number;
  date: string;
  title: string;
  description: string;
}

export default function AffirmationDatePage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/affirmations/${date}`)
      .then(r => {
        if (!r.ok) throw new Error('not_found');
        return r.json();
      })
      .then(data => setAffirmation(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [date]);

  const shareAffirmation = async () => {
    if (!affirmation) return;
    const url = `${window.location.origin}/affirmations/${date}`;
    const text = `${affirmation.title}\n\n${affirmation.description}\n\n💫 ${url}`;
    
    if (navigator.share) {
      navigator.share({ title: affirmation.title, text, url });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { 
      weekday: "long", 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  const getPrevDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getNextDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Загрузка...</div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold mb-2">Аффирмация не найдена</h1>
            <p className="text-slate-400 mb-6">На эту дату аффирмация ещё не создана</p>
            <Link href="/affirmations" className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition">
              ← Все аффирмации
            </Link>
          </div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <Link href="/affirmations" className="text-sm text-slate-400 hover:text-violet-400 mb-6 inline-block">
          ← Все аффирмации
        </Link>

        <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-8 mb-6">
          <div className="text-sm text-violet-300 mb-2 capitalize">{formatDate(affirmation!.date)}</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">{affirmation!.title}</h1>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">{affirmation!.description}</p>
          
          <button
            onClick={shareAffirmation}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition"
          >
            {copied ? "✓ Скопировано" : "📤 Поделиться"}
          </button>
        </div>

        {/* Навигация между датами */}
        <div className="flex justify-between items-center">
          <Link 
            href={`/affirmations/${getPrevDate()}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition"
          >
            ← Предыдущий день
          </Link>
          <Link 
            href={`/affirmations/${getNextDate()}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition"
          >
            Следующий день →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
