"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

const ALL_SIGNS = [
  { slug: "oven", name: "Овен", emoji: "♈" },
  { slug: "telec", name: "Телец", emoji: "♉" },
  { slug: "bliznecy", name: "Близнецы", emoji: "♊" },
  { slug: "rak", name: "Рак", emoji: "♋" },
  { slug: "lev", name: "Лев", emoji: "♌" },
  { slug: "deva", name: "Дева", emoji: "♍" },
  { slug: "vesy", name: "Весы", emoji: "♎" },
  { slug: "skorpion", name: "Скорпион", emoji: "♏" },
  { slug: "strelec", name: "Стрелец", emoji: "♐" },
  { slug: "kozerog", name: "Козерог", emoji: "♑" },
  { slug: "vodoley", name: "Водолей", emoji: "♒" },
  { slug: "ryby", name: "Рыбы", emoji: "♓" },
];

const TYPES = [
  { slug: "general", name: "Общий", icon: "🔮" },
  { slug: "love", name: "Любовь", icon: "❤️" },
  { slug: "career", name: "Карьера", icon: "💼" },
  { slug: "financial", name: "Финансы", icon: "💰" },
  { slug: "health", name: "Здоровье", icon: "🌿" },
];

const PERIODS = [
  { slug: "today", name: "Сегодня" },
  { slug: "tomorrow", name: "Завтра" },
  { slug: "week", name: "Неделя" },
  { slug: "month", name: "Месяц" },
  { slug: "year", name: "Год" },
];

export default function SignHoroscopePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [horoscope, setHoroscope] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("general");
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Состояние для подписки на email
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const currentSign = ALL_SIGNS.find((s) => s.slug === slug);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/daily-horoscopes/${slug}?type=${selectedType}&period=${selectedPeriod}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setHoroscope(data);
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [slug, selectedType, selectedPeriod]);

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      setSubscribeStatus("error");
      setSubscribeMessage("Введите корректный email");
      return;
    }
    setSubscribeStatus("loading");
    try {
      const res = await fetch(`${API_URL}/api/subscribe-daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, sign: slug }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribeStatus("success");
        setSubscribeMessage(data.message || "Отлично! Проверьте почту для подтверждения.");
      } else {
        setSubscribeStatus("error");
        setSubscribeMessage(data.error || "Ошибка подписки");
      }
    } catch (e) {
      setSubscribeStatus("error");
      setSubscribeMessage("Ошибка соединения");
    }
  };

  if (!currentSign) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Знак не найден</h1>
          <Link href="/horoscopes" className="text-violet-400 hover:text-violet-300">← Вернуться ко всем знакам</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/horoscopes" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition">
          ← Все знаки зодиака
        </Link>

        <div className="text-center mb-8">
          <div className="text-7xl mb-4">{currentSign.emoji}</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">
            Гороскоп для {currentSign.name}
          </h1>
        </div>

        {/* Период */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {PERIODS.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedPeriod(p.slug)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                selectedPeriod === p.slug
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-900 border-white/10 text-slate-300 hover:border-violet-500/50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Тип */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TYPES.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedType(t.slug)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                selectedType === t.slug
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-900 border-white/10 text-slate-300 hover:border-violet-500/50"
              }`}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent mb-4" />
            <div>Звёзды считаются...</div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-6 text-center">{error}</div>
        ) : (
          <>
            {/* Сам гороскоп */}
            <article className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-8 sm:p-10 mb-8">
              <div className="text-slate-100 leading-relaxed text-lg whitespace-pre-line">
                {horoscope.horoscope.content}
              </div>
            </article>

            {/* 📬 БЛОК: ЕЖЕДНЕВНАЯ РАССЫЛКА — главная точка входа */}
            <div className="bg-gradient-to-br from-sky-900/30 to-indigo-900/30 border border-sky-500/30 rounded-3xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">📬</div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Получайте гороскоп каждое утро</h2>
                  <p className="text-slate-400 text-sm">Бесплатно, без регистрации</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6">
                Каждое утро в <strong className="text-sky-300">8:00</strong> мы отправляем гороскоп {currentSign.name} вам на email. 
                Общий прогноз, который вы читаете сейчас, — <strong>бесплатно и каждый день</strong>.
              </p>

              {!isLoggedIn ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setSubscribeStatus("idle"); }}
                      placeholder="ваш@email.ru"
                      className="flex-1 bg-slate-900/70 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sky-500 text-white placeholder:text-slate-500"
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribeStatus === "loading"}
                      className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 rounded-xl px-6 py-3 font-semibold transition whitespace-nowrap"
                    >
                      {subscribeStatus === "loading" ? "Отправляем..." : "Подписаться"}
                    </button>
                  </div>
                  {subscribeStatus === "success" && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-emerald-200 text-sm">
                      ✓ {subscribeMessage}
                    </div>
                  )}
                  {subscribeStatus === "error" && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-red-200 text-sm">
                      ✗ {subscribeMessage}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Нажимая «Подписаться», вы соглашаетесь с политикой конфиденциальности. 
                    Отписаться можно в один клик в каждом письме.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                  <p className="text-slate-300">
                    ✓ Вы вошли в аккаунт. Управляйте подпиской в{" "}
                    <Link href="/dashboard" className="text-sky-400 hover:text-sky-300 underline">личном кабинете</Link>.
                  </p>
                </div>
              )}
            </div>

            {/* ✨ БЛОК: ПЕРСОНАЛЬНЫЙ ГОРОСКОП — апсейл */}
            <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-3xl p-8 text-center">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                А теперь — персональный прогноз
              </h2>
              <p className="text-slate-300 mb-6 text-lg">
                Этот прогноз общий — он учитывает только знак зодиака. 
                <strong className="text-violet-300"> Персональный гороскоп</strong> строится на вашей натальной карте: 
                10 планет в 12 домах, аспекты, ретроградность.
              </p>
              <ul className="text-left text-slate-300 mb-6 space-y-2 max-w-md mx-auto">
                <li>✓ Предсказания именно для вас</li>
                <li>✓ 5 сфер: общий, любовь, карьера, финансы, здоровье</li>
                <li>✓ Прогнозы на неделю, месяц, год</li>
                <li>✓ 7 дней бесплатно, без карты</li>
              </ul>
              <Link
                href="/register"
                className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-8 py-4 font-semibold text-lg transition shadow-lg shadow-violet-600/30"
              >
                Построить мой гороскоп →
              </Link>
            </div>

            {/* Другие знаки */}
            <div className="mt-12">
              <h3 className="text-center text-slate-400 mb-4">Другие знаки:</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {ALL_SIGNS.filter((s) => s.slug !== slug).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/horoscopes/${s.slug}`}
                    className="bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-violet-500/50 rounded-lg px-3 py-2 text-sm transition"
                  >
                    <span className="mr-1">{s.emoji}</span>{s.name}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
