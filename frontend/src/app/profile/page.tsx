"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import DateInput from "@/components/DateInput";
import TimeInput from "@/components/TimeInput";
import SiteFooter from "@/components/SiteFooter";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setName(data?.user?.name || data?.name || data?.profile?.name || "");
        if (data?.profile) {
          {
            const d = new Date(data.profile.birth_date);
            if (!isNaN(d.getTime())) {
              setBirthDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
            } else {
              setBirthDate(String(data.profile.birth_date).slice(0, 10));
            }
          }
          setBirthTime((data.profile.birth_time || "").slice(0, 5));
          setBirthCity(data.profile.city || data.profile.birth_city || "");
        }
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    if (!birthDate || !birthCity || birthCity.trim().length < 2) {
      setError("Заполните дату рождения и город");
      return;
    }
    setSaving(true);
    setError("");
      // Проверка города: если заполнен — минимум 3 буквы
      const cityValue = (birthCity || "").trim();
      if (cityValue && cityValue.length < 3) {
        setError("Город должен содержать минимум 3 буквы");
        setLoading(false);
        return;
      }


    try {
      const r = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name || undefined,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_city: birthCity.trim() || undefined,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || data.message || (data.errors ? Object.values(data.errors).flat().join("; ") : "Ошибка сохранения"));
      }
    } catch (e) {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
      <div className="max-w-2xl mx-auto px-4 pt-6 w-full">
        <Link href="/profile/referrals" className="block bg-gradient-to-r from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-4 hover:border-violet-500/60 transition">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">🎁 Приведи друзей</div>
              <div className="text-sm text-slate-400 mt-0.5">5 друзей = 3 месяца бесплатных гороскопов</div>
            </div>
            <span className="text-2xl text-violet-400">→</span>
          </div>
        </Link>
      </div>
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mb-4" />
          <div>Загрузка...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 pt-6 w-full">
        <Link href="/profile/referrals" className="block bg-gradient-to-r from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-4 hover:border-violet-500/60 transition">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">🎁 Приведи друзей</div>
              <div className="text-sm text-slate-400 mt-0.5">5 друзей = 3 месяца бесплатных гороскопов</div>
            </div>
            <span className="text-2xl text-violet-400">→</span>
          </div>
        </Link>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
          Редактирование профиля
        </h1>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 bg-slate-900 border border-white/10">
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500"
              placeholder="Ваше имя"
            />
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-1">Дата рождения *</div>
            <DateInput value={birthDate} onChange={setBirthDate} />
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-1">Время рождения *</div>
            <TimeInput value={birthTime} onChange={setBirthTime} />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-1">Место рождения *</label>
            <input
              type="text"
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              required
              placeholder="Москва, Россия"
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
