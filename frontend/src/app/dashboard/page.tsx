"use client";

import CometField from "@/components/CometField";


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
  const [magazineSubscribed, setMagazineSubscribed] = useState(false);
  const [magazineIssues, setMagazineIssues] = useState<{uuid: string; date: string; sent: boolean}[]>([]);
  const [magazineLoading, setMagazineLoading] = useState(false);
  const [extraHoroscopes, setExtraHoroscopes] = useState<string[]>([]);
  const [mood, setMood] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile) {
          // name/email лежат на User, не в profile — перекладываем
          const p: any = { ...data.profile };
          if (data.name && !p.name) p.name = data.name;
          if (data.email && !p.email) p.email = data.email;
          setProfile(p);
        }
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

    fetch(`${API_URL}/api/magazine/my-issues`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMagazineSubscribed(!!d.subscribed);
          setMagazineIssues(d.issues || []);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/subscription/digest-prefs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setExtraHoroscopes(d.extra_horoscopes || []);
          setMood(d.mood || []);
          setFrequency(d.frequency === "weekly" ? "weekly" : "daily");
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
  const toggleExtra = (slug: string) =>
    setExtraHoroscopes((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  const toggleMoodItem = (slug: string) =>
    setMood((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const saveSettings = async () => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
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
      await fetch(`${API_URL}/api/subscription/digest-prefs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ extra_horoscopes: extraHoroscopes, mood, frequency }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {} finally {
      setSettingsSaving(false);
    }
  };

  const toggleAutoRenew = async (enabled: boolean) => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
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

  const handleMagazineSubscription = async () => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    if (!token) return;
    setMagazineLoading(true);
    try {
      const method = magazineSubscribed ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/api/magazine/subscribe`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMagazineSubscribed(!magazineSubscribed);
    } catch {}
    finally { setMagazineLoading(false); }
  };

  const handleAffirmationSubscription = async () => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
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
      const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
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
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center relative overflow-hidden isolate">
        <CometField count={8} />
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <p className="text-slate-400">Загрузка...</p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="pricing-eyebrow mb-6">👤 Личный кабинет</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            {profile?.name ? `Привет, ${profile.name}!` : "Привет!"}
          </span>
        </h1>

        {/* Баннер про город рождения */}
        {profile && !profile.city && (
          <Link
            href="/profile"
            style={{ ["--accent" as any]: "#fbbf24" }}
            className="home-panel block mb-6 p-6"
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="cal-medal" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <div className="font-semibold text-amber-200 mb-1">Укажите город рождения</div>
                <div className="text-sm text-slate-300">Чтобы получать точные индивидуальные гороскопы — укажите, где вы родились.</div>
              </div>
              <span className="cal-go ml-auto shrink-0">→</span>
            </div>
          </Link>
        )}

        {/* Настройки рассылки */}
        <div className="mb-8">
          <div style={{ ["--accent" as any]: "#a855f7" }} className="home-panel p-6">
            <h2 className="relative z-10 text-2xl font-bold mb-5 flex items-center gap-2"><span>✉️</span><span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Что получать</span></h2>
            <div className="text-sm font-medium text-slate-300 mb-2">Какие гороскопы получать?</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {availTypes.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleType(t.slug)}
                  disabled={settingsSaving}
                  className={`dash-chip ${selTypes.includes(t.slug) ? "dash-chip-active" : ""}`}
                >
                  {typeIcons[t.slug] || "✨"} {t.name}
                </button>
              ))}
            </div>

            <div className="relative z-10 text-sm font-medium text-slate-300 mb-2 mt-6">Другие гороскопы</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { slug: "chinese", name: "Китайский", icon: "🐉" },
                { slug: "japanese", name: "Японский", icon: "🎌" },
                { slug: "zoroastrian", name: "Зороастрийский", icon: "🔥" },
                { slug: "druids", name: "Друидов", icon: "🌳" },
                { slug: "flowers", name: "Цветочный", icon: "🌸" },
              ].map((x) => (
                <button
                  key={x.slug}
                  type="button"
                  onClick={() => toggleExtra(x.slug)}
                  disabled={settingsSaving}
                  className={`dash-chip ${extraHoroscopes.includes(x.slug) ? "dash-chip-active" : ""}`}
                >
                  {x.icon} {x.name}
                </button>
              ))}
            </div>

            <div className="relative z-10 text-sm font-medium text-slate-300 mb-2">Настрой</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { slug: "affirmations", name: "Общие аффирмации", icon: "💫" },
                { slug: "tarot", name: "Карта Таро дня", icon: "🎴" },
                { slug: "biorhythms", name: "Биоритмы", icon: "📊" },
                { slug: "retrograde", name: "Ретроградные планеты", icon: "☿" },
              ].map((x) => (
                <button
                  key={x.slug}
                  type="button"
                  onClick={() => toggleMoodItem(x.slug)}
                  disabled={settingsSaving}
                  className={`dash-chip ${mood.includes(x.slug) ? "dash-chip-active" : ""}`}
                >
                  {x.icon} {x.name}
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
                  className={`dash-chip ${selChannels.includes(c.slug) ? "dash-chip-active" : ""} ${c.slug === 'email' ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {channelIcons[c.slug] || "📬"} {c.name}{c.slug === 'email' ? ' ✓' : ''}
                </button>
              ))}
            </div>

            <div className="relative z-10 text-sm font-medium text-slate-300 mb-2 mt-6">Когда хотите получать?</div>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => setFrequency("daily")}
                disabled={settingsSaving}
                className={`dash-chip ${frequency === "daily" ? "dash-chip-active" : ""}`}
              >
                🌞 Ежедневно
              </button>
              <button
                type="button"
                onClick={() => setFrequency("weekly")}
                disabled={settingsSaving}
                className={`dash-chip ${frequency === "weekly" ? "dash-chip-active" : ""}`}
              >
                📅 Еженедельно
              </button>
            </div>

            <button
              onClick={saveSettings}
              disabled={settingsSaving}
              style={{ ["--accent" as any]: "#a855f7" }}
              className="plan-btn px-6 py-3 rounded-xl font-bold transition disabled:opacity-50"
            >
              {settingsSaving ? "Сохранение..." : "Сохранить настройки"}
            </button>

            {/* Бесплатный персональный гороскоп */}
            {freePersonalEnabled && (
              <div style={{ ["--accent" as any]: "#fbbf24" }} className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border border-amber-400/40 relative overflow-hidden">
                <span className="cal-shine" aria-hidden="true" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="cal-medal" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
                    <span className="text-xl">🎁</span>
                  </div>
                  <div>
                    <div className="font-semibold text-amber-200">
                      Бесплатный персональный ежедневный гороскоп ✅
                    </div>
                    <div className="text-sm text-slate-400">
                      Составляется лично под Вас и приходит каждое утро
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Бесплатная натальная карта */}
            {freeNatalChartEnabled && (
              <div style={{ ["--accent" as any]: "#a855f7" }} className="mt-3 p-5 rounded-2xl bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-400/40 relative overflow-hidden">
                <span className="cal-shine" aria-hidden="true" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="cal-medal" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
                    <span className="text-xl">🌟</span>
                  </div>
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
            <section style={{ ["--accent" as any]: "#38bdf8" }} className="mt-8 home-panel p-6">
              <h3 className="text-xl font-bold mb-1 text-white">📅 Какие календари получать?</h3>
              <p className="text-sm text-slate-400 mb-5">Выберите календари, которые будут приходить вам утром на выбранных каналах.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {calendars.map((c) => (
                  <label key={c.id} className={`dash-cal-card ${selCalendars.includes(c.slug) ? "dash-cal-active" : ""}`}>
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
                  style={{ ["--accent" as any]: "#38bdf8" }}
                  className="plan-btn disabled:opacity-50 rounded-xl px-6 py-2.5 font-bold transition"
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
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span>💫</span><span className="bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">Подписка на аффирмации</span></h2>
          <div style={{ ["--accent" as any]: "#e879f9" }} className="home-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              style={{ ["--accent" as any]: "#e879f9" }}
              className={`plan-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition disabled:opacity-50 ${
                affirmationSubscribed ? "dash-btn-subscribed" : ""
              }`}
            >
              {affirmationLoading ? "..." : affirmationSubscribed ? "✓ Подписан (отписаться)" : "Подписаться"}
            </button>
          </div>
        </div>

        {/* Блок журнала */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">📰 Ежедневный журнал</h2>
          <div style={{ ["--accent" as any]: "#f59e0b" }} className="home-panel p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="relative z-10">
                <div className="font-semibold mb-1">Персональная газета каждое утро</div>
                <div className="text-sm text-slate-400">
                  {magazineSubscribed
                    ? "Вы подписаны — журнал приходит в 8:00"
                    : "Гороскоп, аффирмация, таро, биоритмы — всё в одном выпуске"}
                </div>
              </div>
              <button
                onClick={handleMagazineSubscription}
                disabled={magazineLoading}
                style={{ ["--accent" as any]: "#f59e0b" }}
                className={`plan-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition disabled:opacity-50 ${
                  magazineSubscribed ? "dash-btn-subscribed" : ""
                }`}
              >
                {magazineLoading ? "..." : magazineSubscribed ? "✓ Подписан (отписаться)" : "💌 Подписаться на журнал"}
              </button>
            </div>

            {magazineIssues.length > 0 && (
              <div className="relative z-10">
                <div className="text-sm font-medium text-slate-300 mb-3">Последние выпуски:</div>
                <div className="space-y-2">
                  {magazineIssues.slice(0, 5).map((issue, i) => (
                    <a
                      key={issue.uuid}
                      href={`/magazine/${issue.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-amber-500/40 hover:bg-slate-900/80 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">📰</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-white group-hover:text-amber-300 transition truncate">
                            Выпуск от {new Date(issue.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {issue.sent ? "✓ Отправлен на почту" : "Готов"}
                          </div>
                        </div>
                      </div>
                      <span className="text-amber-400 text-xl shrink-0 group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Блок натальной карты (скрыт если бесплатная включена) */}
        {!freeNatalChartEnabled && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span>🌟</span><span className="bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">Натальная карта</span></h2>
          <div style={{ ["--accent" as any]: "#a855f7" }} className="home-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              style={{ ["--accent" as any]: "#a855f7" }}
              className={`plan-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                hasNatalChart && natalChartSubscribed
                  ? "bg-green-500/20 text-green-400 hover:bg-violet-600 hover:text-white"
                  : "bg-violet-600 hover:bg-violet-500"
              }`}
            >
              {!hasNatalChart ? "Заказать — 49₽" : natalChartSubscribed ? "✓ Подписан" : "Подписаться — 299₽/мес"}
            </Link>
          </div>
        </div>

        )}

        {/* Блок Мессенджеры */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span>📱</span><span className="bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent">Мессенджеры</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Telegram */}
            <div style={{ ["--accent" as any]: "#229ed9" }} className="home-panel p-6 flex flex-col items-start justify-between gap-4">
              <div>
                <div className="font-semibold mb-1 text-white">🤖 Telegram</div>
                <div className="text-sm text-slate-400">
                  {tgConnected
                    ? "Подключено"
                    : "Получайте персональные гороскопы прямо в Telegram"}
                </div>
              </div>
              {tgConnected ? (
                <span className="dash-status-connected">✓ Подключено</span>
              ) : (
                <a
                  href={tgLink ? tgLink.replace(/\?start=.*/, '') : `https://t.me/${'neiro_horoskop_bot'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ["--accent" as any]: "#229ed9" }}
                  className="plan-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
                >
                  Подключить Telegram
                </a>
              )}
            </div>

            {/* MAX */}
            <div style={{ ["--accent" as any]: "#0077ff" }} className="home-panel p-6 flex flex-col items-start justify-between gap-4">
              <div>
                <div className="font-semibold mb-1 text-white">💬 MAX</div>
                <div className="text-sm text-slate-400">
                  {maxConnected
                    ? "Подключено"
                    : "Получайте персональные гороскопы в MAX Messenger"}
                </div>
              </div>
              {maxConnected ? (
                <span className="dash-status-connected">✓ Подключено</span>
              ) : (
                <a
                  href={maxLink || "https://max.ru/id263211995820_bot"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ["--accent" as any]: "#0077ff" }}
                  className="plan-btn px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
                >
                  Подключить MAX
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Блок профиля */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span>👤</span><span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Данные рождения</span></h2>
          {profile ? (
            <div style={{ ["--accent" as any]: "#34d399" }} className="home-panel p-6">
              <div className="relative z-10 grid md:grid-cols-2 gap-4 mb-4">
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
              <Link href="/profile" className="dash-edit-link">
                Редактировать профиль →
              </Link>
            </div>
          ) : (
            <div style={{ ["--accent" as any]: "#34d399" }} className="home-panel p-6 text-center">
              <div className="relative z-10 text-lg text-slate-400 mb-4">
                Заполните данные рождения для получения персональных гороскопов
              </div>
              <Link
                href="/profile"
                style={{ ["--accent" as any]: "#34d399" }}
                className="inline-block plan-btn px-6 py-3 rounded-xl font-bold"
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
            style={{ ["--accent" as any]: "#a855f7" }}
            className="cal-card relative rounded-3xl p-6 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden block"
          >
            <span className="cal-shine" aria-hidden="true" />
            <div className="cal-medal mb-3" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
              <span className="text-2xl">🔮</span>
            </div>
            <div className="relative z-10 font-bold mb-1 text-white">Мои гороскопы</div>
            <div className="relative z-10 text-sm text-slate-400">История персональных прогнозов</div>
          </Link>
          <Link
            href="/pricing"
            style={{ ["--accent" as any]: "#fbbf24" }}
            className="cal-card relative rounded-3xl p-6 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden block"
          >
            <span className="cal-shine" aria-hidden="true" />
            <div className="cal-medal mb-3" style={{ width: "56px", height: "56px", borderRadius: "18px" }}>
              <span className="text-2xl">💎</span>
            </div>
            <div className="relative z-10 font-bold mb-1 text-white">Тарифы</div>
            <div className="relative z-10 text-sm text-slate-400">Просмотр и смена подписки</div>
          </Link>
        </div>
      
        {/* История гаданий */}
        <section className="mt-12 border-t border-white/10 overflow-x-clip">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2"><span>📜</span><span className="bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">История гаданий</span></h2>
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
            <div style={{ ["--accent" as any]: "#a855f7" }} className="home-panel p-8 text-center">
              <div className="relative z-10 text-5xl mb-3">🔮</div>
              <p className="text-slate-400 mb-4">Вы ещё не гадали</p>
              <Link
                href="/divinations"
                style={{ ["--accent" as any]: "#a855f7" }}
                className="inline-block plan-btn rounded-xl px-6 py-3 font-bold"
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
                  className="dash-history-card group relative p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border border-white/5 overflow-hidden block"
                >
                  <span className="cal-shine" aria-hidden="true" />
                    <div className="relative z-10 flex items-start gap-3">
                      <div className="cal-medal shrink-0" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
                        <span className="text-xl">{h.emoji}</span>
                      </div>
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
            <Link href="/profile/referrals" style={{ ["--accent" as any]: "#ec4899" }} className="home-panel block p-6 group">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">🎁 Приведи друзей</h2>
                  <p className="text-slate-400">5 друзей = 3 месяца бесплатных персональных гороскопов</p>
                </div>
                <span className="relative z-10 cal-go shrink-0 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </section>
        </div>

          <SiteFooter />
        </main>
      );
    }
