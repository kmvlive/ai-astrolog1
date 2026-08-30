"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

const CHANNEL_ICONS: Record<string, string> = {
  email: "📧",
  telegram: "✈️",
  max: "💬",
};

const TYPE_ICONS: Record<string, string> = {
  general: "🔮",
  career: "💼",
  health: "🌿",
  daily: "🌞",
  weekly: "📅",
  monthly: "🗓",
  yearly: "🎊",
  love: "❤️",
  finance: "💰",
};

export default function SubscriptionSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/subscription/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setChannels(data.channels || []);
        setTypes(data.types || []);
        setSelectedChannels(data.user_channel_slugs || []);
        setSelectedTypes(data.user_type_slugs || []);
        setSubscription(data.subscription);
        setEmail(data.email || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("auth_token");

    try {
      const [chRes, tyRes] = await Promise.all([
        fetch(`${API_URL}/api/subscription/channels`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ channels: selectedChannels }),
        }),
        fetch(`${API_URL}/api/subscription/types`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ types: selectedTypes }),
        }),
      ]);

      if (chRes.ok && tyRes.ok) {
        setMessage({ type: "success", text: "Настройки сохранены! Изменения применятся к следующей рассылке." });
      } else {
        const err = await chRes.json().catch(() => ({}));
        setMessage({ type: "error", text: err.message || "Ошибка сохранения" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка соединения" });
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (slug: string) => {
    setSelectedChannels((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const toggleType = (slug: string) => {
    setSelectedTypes((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        <div className="text-slate-400">Загрузка настроек...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl">⚙️</div>
        <div>
          <h3 className="text-2xl font-bold">Управление подписками</h3>
          <p className="text-sm text-slate-400">Настройте, что и куда присылать</p>
        </div>
      </div>

      {subscription && (
        <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-violet-200">
                {subscription.status === "trial" ? "🎁 Пробный период" : "✨ Активная подписка"}
              </div>
              <div className="text-sm text-slate-300 mt-1">
                {subscription.status === "trial" && subscription.trial_ends_at
                  ? `Действует до ${formatDate(subscription.trial_ends_at)}`
                  : subscription.expires_at
                  ? `Действует до ${formatDate(subscription.expires_at)}`
                  : "Бессрочная"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Аккаунт</div>
              <div className="text-sm font-medium">{email}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">📬 Каналы доставки</h4>
        <p className="text-sm text-slate-400 mb-4">
          Выберите, куда присылать гороскопы. Можно несколько каналов одновременно.
        </p>
        <div className="grid gap-3">
          {channels.map((ch) => {
            const selected = selectedChannels.includes(ch.slug);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.slug)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                  selected
                    ? "bg-violet-600/20 border-violet-500 text-white"
                    : "bg-slate-800/50 border-white/10 text-slate-300 hover:border-violet-500/50"
                }`}
              >
                <div className="text-3xl">{CHANNEL_ICONS[ch.slug] || "📭"}</div>
                <div className="flex-1">
                  <div className="font-semibold">{ch.name}</div>
                  <div className="text-xs text-slate-400">{ch.description}</div>
                  {selected && ch.slug === "email" && (
                    <div className="text-xs text-violet-300 mt-1">→ на {email}</div>
                  )}
                </div>
                <div
                  className={`w-12 h-6 rounded-full relative transition ${
                    selected ? "bg-violet-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                      selected ? "translate-x-6" : ""
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">✨ Типы гороскопов</h4>
        <p className="text-sm text-slate-400 mb-4">
          Какие прогнозы вы хотите получать. Можно выбрать несколько.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {types.map((t) => {
            const selected = selectedTypes.includes(t.slug);
            return (
              <button
                key={t.id}
                onClick={() => toggleType(t.slug)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                  selected
                    ? "bg-violet-600/20 border-violet-500 text-white"
                    : "bg-slate-800/50 border-white/10 text-slate-300 hover:border-violet-500/50"
                }`}
              >
                <div className="text-2xl">{TYPE_ICONS[t.slug] || "🔮"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400 truncate">{t.description}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition ${
                    selected ? "bg-violet-600 border-violet-500" : "border-white/20"
                  }`}
                >
                  {selected && <span className="text-white text-xs">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 rounded-xl px-6 py-3 font-semibold transition"
      >
        {saving ? "Сохранение..." : "Сохранить настройки"}
      </button>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm mt-4 ${
            message.type === "success"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
              : "bg-red-500/20 border border-red-500/40 text-red-200"
          }`}
        >
          {message.type === "success" ? "✓" : "✗"} {message.text}
        </div>
      )}

      {selectedChannels.length === 0 && selectedTypes.length === 0 && !loading && (
        <div className="mt-4 text-center text-sm text-amber-300/70 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          ⚠️ Вы пока не выбрали ни каналов, ни типов гороскопов. Выберите хотя бы один канал и один тип — и начните получать прогнозы!
        </div>
      )}
    </div>
  );
}
