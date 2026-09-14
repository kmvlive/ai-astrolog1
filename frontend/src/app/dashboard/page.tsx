"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

type Profile = {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_city?: string;
  city?: string;
  zodiac_sign?: string;
};

type CalendarType = { id: number; slug: string; name: string; emoji: string; description: string; };

type Subscription = {
  status: string;
  plan_type: string;
  expires_at: string;
  trial_ends_at?: string | null;
  auto_renew?: boolean;
  rebill_id?: string | null;
  amount?: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tgLink, setTgLink] = useState("");
  const [tgConnected, setTgConnected] = useState(false);
  const [maxConnected, setMaxConnected] = useState(false);
  const [maxLink, setMaxLink] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [rebillId, setRebillId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availTypes, setAvailTypes] = useState<{ slug: string; name: string }[]>([]);
  const [selTypes, setSelTypes] = useState<string[]>([]);
  const [availChannels, setAvailChannels] = useState<{ slug: string; name: string }[]>([]);
  const [selChannels, setSelChannels] = useState<string[]>([]);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [freePersonalEnabled, setFreePersonalEnabled] = useState(false);
  const [freeNatalChartEnabled, setFreeNatalChartEnabled] = useState(false);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selCalendars, setSelCalendars] = useState<string[]>([]);
  const [calendarsSaving, setCalendarsSaving] = useState(false);
  const [calendarsSaved, setCalendarsSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [history, setHistory] = useState<{ uuid: string; type: string; type_name: string; emoji: string; question: string | null; preview: string; date: string }[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [affirmationSubscribed, setAffirmationSubscribed] = useState(false);
  const [affirmationLoading, setAffirmationLoading] = useState(false);
  const [hasNatalChart, setHasNatalChart] = useState(false);
  const [natalChartSubscribed, setNatalChartSubscribed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile) setProfile(data.profile);
        if (data?.subscription) {
          setSubscription(data.subscription);
          setAutoRenew(!!data.subscription.auto_renew);
          setRebillId(data.subscription.rebill_id || null);
        }
      })
      .catch(() => {});

    // Натальная карта
    fetch(`${API_URL}/api/natal-chart/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.has_chart) {
          setHasNatalChart(true);
          setNatalChartSubscribed(data.weekly_opt_in || false);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/subscription/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setAvailTypes(d.types || []);
          setSelTypes(d.user_type_slugs || []);
          setAvailChannels(d.channels || []);
          const channels = d.user_channel_slugs || [];
          if (!channels.includes('email')) channels.push('email');
          setSelChannels(channels);
          setFreePersonalEnabled(!!d.free_personal_enabled);
          setFreeNatalChartEnabled(!!d.free_natal_chart_enabled);
          setCalendars(d.calendars || []);
          setSelCalendars(d.user_calendar_slugs || []);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/telegram/link`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setTgLink(d.url || "");
          setTgConnected(!!d.connected);
        }
      })
      .catch(() => {});

    // Загрузка статуса подписки на аффирмации
    fetch(`${API_URL}/api/affirmations/subscription-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { subscribed: false })
      .then(data => setAffirmationSubscribed(data.subscribed || false))
      .catch(() => {});

    fetch(`${API_URL}/api/divination/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) {
          setHistory(d.items);
          setHistoryTotal(d.total || 0);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/max/link`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMaxLink(d.url || "");
          setMaxConnected(!!d.connected);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  const isExpired = subscription && new Date(subscription.expires_at).getTime() < Date.now();
  const EPOCH = new Date("1970-01-02").getTime();
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : 0;
  const trialEnds = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).getTime() : 0;
  const isActive = !!subscription && subscription.status === "active" && expiresAt > Date.now() && expiresAt > EPOCH;
  const isTrial = !!subscription && subscription.status === "trial" && trialEnds > Date.now();

  const typeIcons: Record<string, string> = { general: "🔮", love: "❤️", career: "💼", finance: "💰", health: "🌿", chinese: "🐉", tibetan: "🏔️" };
  const channelIcons: Record<string, string> = { email: "✉️", telegram: "🤖", max: "💬" };

  const toggleType = (slug: string) =>
    setSelTypes((prev) => (prev.includes(slug) ? prev.filter((s2) => s2 !== slug) : [...prev, slug]));
  const toggleChannel = (slug: string) =>
    setSelChannels((prev) => (prev.includes(slug) ? prev.filter((s2) => s2 !== slug) : [...prev, slug]));

  const saveSettings = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      await fetch(`${API_URL}/api/subscription/types`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ types: selTypes }),
      });
      await fetch(`${API_URL}/api/subscription/channels`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ channels: selChannels }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {} finally {
      setSettingsSaving(false);
    }
  };

  const toggleAutoRenew = async (enabled: boolean) => {
    const token = localStorage.getItem("auth_token");
    if (!token || !subscription) return;
    setAutoSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/subscription/auto-renew`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await r.json();
      if (data.success) {
        setAutoRenew(enabled);
      } else {
        alert(data.message || "Не удалось изменить настройку");
      }
    } catch (e) {
      alert("Ошибка сети");
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAffirmationSubscription = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    
    setAffirmationLoading(true);
    try {
      if (affirmationSubscribed) {
        // Отписка через API
        const res = await fetch(`${API_URL}/api/affirmations/subscribe`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAffirmationSubscribed(false);
      } else {
        const res = await fetch(`${API_URL}/api/affirmations/subscribe`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) setAffirmationSubscribed(true);
      }
    } catch {}
    finally { setAffirmationLoading(false); }
  };

  const planNames: Record<string, string> = {
    week: "Неделя",
    month: "Месяц",
    year: "Год",
  };

  const planDays: Record<string, number> = { week: 7, month: 30, year: 365 };

  const zodiacRu: Record<string, string> = {
    Ari: "Овен ♈", Tau: "Телец ♉", Gem: "Близнецы ♊", Can: "Рак ♋",
    Leo: "Лев ♌", Vir: "Дева ♍", Lib: "Весы ♎", Sco: "Скорпион ♏",
    Sag: "Стрелец ♐", Cap: "Козерог ♑", Aqu: "Водолей ♒", Pis: "Рыбы ♓",
  };


  const toggleCalendar = (slug: string) => {
    setSelCalendars((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const saveCalendars = async () => {
    setCalendarsSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_URL}/api/subscription/calendars`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: selCalendars }),
      });
      setCalendarsSaved(true);
      setTimeout(() => setCalendarsSaved(false), 2500);
    } catch {}
    setCalendarsSaving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <p className="text-slate-400">Загрузка...</p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
          Личный кабинет
        </h1>

        {/* Баннер про город рождения */}
        {profile && !profile.city && (
          <Link
            href="/profile"
            className="block mb-6 p-5 bg-gradient-to-r from-amber-900/30 to-violet-900/30 border border-amber-500/30 rounded-2xl hover:border-amber-400/50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📍</div>
              <div>
                <div className="font-semibold text-amber-200 mb-1">Укажите город рождения</div>
                <div className="text-sm text-slate-300">Чтобы получать точные индивидуальные гороскопы — укажите, где вы родились.</div>
              </div>
              <div className="ml-auto text-amber-400 text-2xl">→</div>
            </div>
          </Link>
        )}

        {/* Настройки рассылки */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Что получать</h2>
          <div className="rounded-2xl p-6 bg-slate-900 border border-white/10">
            <div className="text-sm font-medium text-slate-300 mb-2">Какие гороскопы получать?</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {availTypes.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleType(t.slug)}
                  disabled={settingsSaving}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    selTypes.includes(t.slug)
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                  }`}
                >
                  {typeIcons[t.slug] || "✨"} {t.name}
                </button>
              ))}
            </div>

            <div className="text-sm font-medium text-slate-300 mb-2">Куда присылать?</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {availChannels.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => c.slug !== 'email' && toggleChannel(c.slug)}
                  disabled={settingsSaving || c.slug === 'email'}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    c.slug === 'email'
                      ? "bg-violet-600 border-violet-500 text-white opacity-80 cursor-not-allowed"
                      : selChannels.includes(c.slug)
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-800 border-white/10 text-slate-300 hover:border-violet-500/50"
                  }`}
                >
                  {channelIcons[c.slug] || "📬"} {c.name}{c.slug === 'email' ? ' ✓' : ''}
                </button>
              ))}
            </div>

            <button
              onClick={saveSettings}
              disabled={settingsSaving}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition disabled:opacity-50"
            >
              {settingsSaving ? "Сохранение..." : "Сохранить настройки"}
            </button>

            {/* Бесплатный персональный гороскоп */}
            {freePersonalEnabled && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-900/20 to-yellow-900/20 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <div className="font-semibold text-amber-200">
                      Бесплатный персональный ежедневный гороскоп ✅
                    </div>
                    <div className="text-sm text-slate-400">
                      Составляется по вашей натальной карте и приходит каждое утро
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Бесплатная натальная карта */}
            {freeNatalChartEnabled && (
              <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌟</span>
                  <div>
                    <div className="font-semibold text-violet-200">
                      Бесплатная натальная карта ✅
                    </div>
                    <div className="text-sm text-slate-400">
                      Полная AI-интерпретация с SVG-колесом вашей натальной карты
                    </div>
                  </div>
                </div>
              </div>
            )}
            {settingsSaved && <span className="ml-3 text-green-400 text-sm">✓ Сохранено</span>}
          </div>

          {/* Какие календари получать */}
          {calendars.length > 0 && (
            <section className="mt-8 p-6 rounded-2xl bg-slate-900/60 border border-white/10">
              <h3 className="text-xl font-bold mb-1">📅 Какие календари получать?</h3>
              <p className="text-sm text-slate-400 mb-5">Выберите календари, которые будут приходить вам утром на выбранных каналах.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {calendars.map((c) => (
                  <label key={c.id} className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition ${selCalendars.includes(c.slug) ? "bg-violet-600/20 border-violet-500/40" : "bg-slate-800/50 border-white/5 hover:border-white/20"}`}>
                    <input
                      type="checkbox"
                      checked={selCalendars.includes(c.slug)}
                      onChange={() => toggleCalendar(c.slug)}
                      className="mt-1 w-5 h-5 accent-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{c.emoji}</span>
                        <span className="font-semibold">{c.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{c.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={saveCalendars}
                  disabled={calendarsSaving}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl px-6 py-2.5 font-semibold transition"
                >
                  {calendarsSaving ? "Сохраняем..." : "Сохранить"}
                </button>
                {calendarsSaved && <span className="text-emerald-400 text-sm">✓ Сохранено</span>}
              </div>
            </section>
          )}
        </div>

        {/* Блок подписки на аффирмации */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">💫 Подписка на аффирмации</h2>
          <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold mb-1">Ежедневные аффирмации</div>
              <div className="text-sm text-slate-400">
                {affirmationSubscribed
                  ? "Вы подписаны — аффирмация приходит каждое утро в 8:00"
                  : "Получайте вдохновляющую аффирмацию каждое утро"}
              </div>
            </div>
            <button
              onClick={handleAffirmationSubscription}
              disabled={affirmationLoading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition disabled:opacity-50 ${
                affirmationSubscribed
                  ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                  : "bg-violet-600 hover:bg-violet-500"
              }`}
            >
              {affirmationLoading ? "..." : affirmationSubscribed ? "✓ Подписан (отписаться)" : "Подписаться"}
            </button>
          </div>
        </div>

        {/* Блок натальной карты */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🌟 Натальная карта</h2>
          <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold mb-1">Персональный гороскоп по натальной карте</div>
              <div className="text-sm text-slate-400">
                {hasNatalChart
                  ? natalChartSubscribed
                    ? "Вы получаете 4 персональных гороскопа в месяц"
                    : "Карта готова. Подпишитесь на еженедельный гороскоп"
                  : "Закажите натальную карту для точных прогнозов"}
              </div>
            </div>
            <Link
              href="/natal-chart"
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                hasNatalChart && natalChartSubscribed
                  ? "bg-green-500/20 text-green-400 hover:bg-violet-600 hover:text-white"
                  : "bg-violet-600 hover:bg-violet-500"
              }`}
            >
              {!hasNatalChart ? "Заказать — 49₽" : natalChartSubscribed ? "✓ Подписан" : "Подписаться — 299₽/мес"}
            </Link>
          </div>
        </div>

        {/* Блок Telegram */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Telegram</h2>
          <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold mb-1">🤖 Гороскопы в Telegram</div>
              <div className="text-sm text-slate-400">
                {tgConnected
                  ? "Подключено"
                  : "Получайте персональные гороскопы прямо в Telegram"}
              </div>
            </div>
            {tgConnected ? (
              <span className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold whitespace-nowrap">
                ✓ Подключено
              </span>
            ) : (
              <a
                href={tgLink ? tgLink.replace(/\?start=.*/, '') : `https://t.me/${'neiro_horoskop_bot'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold whitespace-nowrap transition"
              >
                Подключить Telegram
              </a>
            )}
          </div>
        </div>

        
        {/* Блок MAX */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">MAX</h2>
          <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold mb-1">💬 Гороскопы в MAX</div>
              <div className="text-sm text-slate-400">
                {maxConnected
                  ? "Подключено"
                  : "Получайте персональные гороскопы в MAX Messenger"}
              </div>
            </div>
            {maxConnected ? (
              <span className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold whitespace-nowrap">
                ✓ Подключено
              </span>
            ) : (
              <a
                href={maxLink || "https://max.ru/id263211995820_bot"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold whitespace-nowrap transition"
              >
                Подключить MAX
              </a>
            )}
          </div>
        </div>

        {/* Блок профиля */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Данные рождения</h2>
          {profile ? (
            <div className="rounded-2xl p-6 bg-slate-900 border border-white/10">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {profile.name && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Имя</div>
                    <div className="text-lg">{profile.name}</div>
                  </div>
                )}
                {profile.zodiac_sign && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Знак зодиака</div>
                    <div className="text-lg">{zodiacRu[profile.zodiac_sign] || profile.zodiac_sign}</div>
                  </div>
                )}
                {profile.birth_date && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Дата рождения</div>
                    <div className="text-lg">
                      {new Date(profile.birth_date).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                )}
                {profile.birth_time && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Время рождения</div>
                    <div className="text-lg">{profile.birth_time}</div>
                  </div>
                )}
                {profile.birth_city && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Место рождения</div>
                    <div className="text-lg">{profile.birth_city}</div>
                  </div>
                )}
              </div>
              <Link
                href="/profile"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                Редактировать профиль →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl p-6 bg-slate-900 border border-white/10 text-center">
              <div className="text-lg text-slate-400 mb-4">
                Заполните данные рождения для получения персональных гороскопов
              </div>
              <Link
                href="/profile"
                className="inline-block bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold"
              >
                Заполнить профиль
              </Link>
            </div>
          )}
        </div>

        {/* Быстрые действия */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/my-horoscopes"
            className="rounded-2xl p-6 bg-slate-900 border border-white/10 hover:border-violet-500/50 transition"
          >
            <div className="text-2xl mb-2">🔮</div>
            <div className="font-bold mb-1">Мои гороскопы</div>
            <div className="text-sm text-slate-400">История персональных прогнозов</div>
          </Link>
          <Link
            href="/pricing"
            className="rounded-2xl p-6 bg-slate-900 border border-white/10 hover:border-amber-400/50 transition"
          >
            <div className="text-2xl mb-2">💎</div>
            <div className="font-bold mb-1">Тарифы</div>
            <div className="text-sm text-slate-400">Просмотр и смена подписки</div>
          </Link>
        </div>
      
        {/* История гаданий */}
        <section className="mt-12 border-t border-white/10 overflow-x-clip">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">📜 История гаданий</h2>
              <p className="text-sm text-slate-400 mt-1">
                {historyTotal > 0 ? `Всего предсказаний: ${historyTotal}` : "Ваши предсказания появятся здесь"}
              </p>
            </div>
            {historyTotal > 0 && (
              <Link href="/divinations" className="text-sm text-violet-300 hover:text-violet-200 transition">
                Новое гадание →
              </Link>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center">
              <div className="text-5xl mb-3">🔮</div>
              <p className="text-slate-400 mb-4">Вы ещё не гадали</p>
              <Link
                href="/divinations"
                className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition"
              >
                Погадать сейчас
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {history.slice(0, 10).map((h) => (
                <Link
                  key={h.uuid}
                  href={`/share/${h.uuid}`}
                  className="group p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-violet-500/30 hover:bg-slate-900/80 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{h.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-white group-hover:text-violet-300 transition truncate">
                          {h.type_name}
                        </h3>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{h.date}</span>
                      </div>
                      {h.question && (
                        <div className="text-sm text-violet-300/80 truncate mb-1">
                          «{h.question}»
                        </div>
                      )}
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {h.preview.slice(0, 140)}{h.preview.length > 140 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {historyTotal > 10 && (
            <div className="text-center mt-4 text-sm text-slate-500">
              Показано 10 из {historyTotal} · <Link href="/divinations" className="text-violet-300 hover:text-violet-200">новое гадание</Link>
            </div>
          )}
        </div>
        </section>
          

</div>

        {/* Приведи друзей */}
        <div className="max-w-6xl mx-auto px-4">
          <section className="mt-8">
            <Link href="/profile/referrals" className="block bg-gradient-to-r from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-6 hover:border-violet-500/60 transition group">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">🎁 Приведи друзей</h2>
                  <p className="text-slate-400">5 друзей = 3 месяца бесплатных персональных гороскопов</p>
                </div>
                <span className="text-4xl text-violet-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </section>
        </div>

          <SiteFooter />
        </main>
      );
    }
