"use client";

import CometField from "@/components/CometField";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function NatalChartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [planSlug, setPlanSlug] = useState<"natal-chart-once" | "natal-chart-weekly">("natal-chart-once");
  const [agreeOffer, setAgreeOffer] = useState(false);
  const [agreePersonalData, setAgreePersonalData] = useState(false);
  const [weeklyOptIn, setWeeklyOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasChart, setHasChart] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [planetsData, setPlanetsData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    if (token) {
      setIsLoggedIn(true);
      // Загружаем данные профиля
      fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user?.email) setEmail(data.user.email);
          if (data?.profile) {
            if (data.profile.birth_date) setBirthDate(data.profile.birth_date.split("T")[0]);
            if (data.profile.birth_time) setBirthTime(data.profile.birth_time);
            if (data.profile.city) setCity(data.profile.city);
          }
        })
        .catch(() => {});

      // Проверяем есть ли уже карта
      fetch(`${API}/api/natal-chart/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.has_chart) {
            setHasChart(true);
            setChartData(data.chart);
          // Загружаем SVG если есть
          if (data.chart?.planets) setPlanetsData(data.chart.planets);
          if (data.chart?.svg_url) {
            const token = (typeof window !== "undefined" ? localStorage.getItem('auth_token') : null);
            fetch(`${API}${data.chart.svg_url}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
              .then(r => r.ok ? r.text() : null)
              .then(svg => {
                if (svg) setSvgContent(svg);
              })
              .catch(() => {});
          }
            setWeeklyOptIn(data.weekly_opt_in || false);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Поллинг статуса после оплаты
  useEffect(() => {
    if (paymentStatus === "success" && isLoggedIn) {
      setPolling(true);
      const interval = setInterval(async () => {
        const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
        if (!token) return;
        const res = await fetch(`${API}/api/natal-chart/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.has_chart && data.chart?.status === "completed") {
          setHasChart(true);
          setChartData(data.chart);
          // Загружаем SVG если есть
          if (data.chart?.planets) setPlanetsData(data.chart.planets);
          if (data.chart?.svg_url) {
            const token = (typeof window !== "undefined" ? localStorage.getItem('auth_token') : null);
            fetch(`${API}${data.chart.svg_url}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
              .then(r => r.ok ? r.text() : null)
              .then(svg => {
                if (svg) setSvgContent(svg);
              })
              .catch(() => {});
          }
          setPolling(false);
          clearInterval(interval);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus, isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeOffer || !agreePersonalData) {
      setError("Необходимо принять все обязательные соглашения");
      return;
    }

    setSubmitting(true);
    try {
      const body: any = {
        email,
        birth_date: birthDate,
        birth_time: birthTime || null,
        gender: gender || null,
        city: city || null,
        plan_slug: planSlug,
        agree_offer: true,
        agree_personal_data: true,
        weekly_horoscope_opt_in: weeklyOptIn,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/natal-chart/order`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.message || "Ошибка при создании заказа");
      }
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWeekly = async () => {
    const token = (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    if (!token) return;
    const res = await fetch(`${API}/api/natal-chart/toggle-weekly`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setWeeklyOptIn(data.weekly_opt_in);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="flex-1 flex items-center justify-center text-slate-400">Загрузка...</div>
        <SiteFooter />
      </main>
    );
  }

  // Если карта уже готова — показываем её
  if (hasChart && chartData?.interpretation) {
    return (
      <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
          <h1 className="text-3xl font-bold mb-2">🌟 Ваша натальная карта</h1>
          <p className="text-slate-400 mb-6">
            Дата рождения: {chartData.birth_date} {chartData.birth_time ? `• Время: ${chartData.birth_time}` : ""}
          </p>

          {/* SVG Колесо натальной карты */}
          {svgContent && (
            <div className="mb-8 flex justify-center">
              <div 
                className="max-w-full overflow-auto rounded-2xl border border-white/10 bg-white p-4"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{ maxHeight: '600px' }}
              />
            </div>
          )}

          {/* Таблица положений планет */}
          {planetsData && (
            <div className="mb-8 overflow-x-auto">
              <h3 className="text-xl font-bold mb-4">🪐 Положения планет</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Планета</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Знак</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Градус</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Дом</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(planetsData).map(([name, data]: [string, any]) => {
                    const signsRu: Record<string, string> = {
                      Ari: "Овен ♈", Tau: "Телец ♉", Gem: "Близнецы ♊",
                      Can: "Рак ♋", Leo: "Лев ♌", Vir: "Дева ♍",
                      Lib: "Весы ♎", Sco: "Скорпион ♏", Sag: "Стрелец ♐",
                      Cap: "Козерог ♑", Aqu: "Водолей ♒", Pis: "Рыбы ♓",
                    };
                    const housesRu: Record<string, string> = {
                      First_House: "I", Second_House: "II", Third_House: "III",
                      Fourth_House: "IV", Fifth_House: "V", Sixth_House: "VI",
                      Seventh_House: "VII", Eighth_House: "VIII", Ninth_House: "IX",
                      Tenth_House: "X", Eleventh_House: "XI", Twelfth_House: "XII",
                    };
                    const planetsRu: Record<string, string> = {
                      Sun: "☉ Солнце", Moon: "☽ Луна", Mercury: "☿ Меркурий",
                      Venus: "♀ Венера", Mars: "♂ Марс", Jupiter: "♃ Юпитер",
                      Saturn: "♄ Сатурн", Uranus: "♅ Уран", Neptune: "♆ Нептун",
                      Pluto: "♇ Плутон",
                    };
                    const deg = data.degree || 0;
                    const signDeg = Math.floor(deg % 30);
                    const signMin = Math.floor((deg % 1) * 60);
                    return (
                      <tr key={name} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 font-semibold">{planetsRu[name] || name}</td>
                        <td className="py-3 px-4">{signsRu[data.sign] || data.sign}</td>
                        <td className="py-3 px-4">{signDeg}° {signMin}\'</td>
                        <td className="py-3 px-4">{housesRu[data.house] || data.house}</td>
                        <td className="py-3 px-4">
                          {data.retrograde ? (
                            <span className="text-red-400 font-semibold">℞ Ретроградная</span>
                          ) : (
                            <span className="text-green-400">Прямая</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Текстовая интерпретация */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: chartData.interpretation.replace(/\n/g, "<br/>").replace(/## (.*)/g, "<h2>$1</h2>") }} />
          </div>

          {/* Управление еженедельным гороскопом */}
          <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-6">
            <h3 className="font-semibold mb-2">📅 Еженедельный гороскоп по вашей карте</h3>
            <p className="text-sm text-slate-400 mb-4">
              Получайте персональный гороскоп на основе вашей натальной карты каждую неделю (4 в месяц за 299₽)
            </p>
            <button
              onClick={toggleWeekly}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                weeklyOptIn
                  ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                  : "bg-violet-600 hover:bg-violet-500"
              }`}
            >
              {weeklyOptIn ? "✓ Подписан (отписаться)" : "Подписаться — 299₽/мес"}
            </button>
          </div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  // Поллинг — ждём генерацию
  if (polling) {
    return (
      <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
        <SiteHeader />
      <CometField count={8} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <h2 className="text-2xl font-bold mb-2">Генерируем вашу натальную карту...</h2>
          <p className="text-slate-400">Это займёт 1-2 минуты. AI анализирует положения планет.</p>
        </div>
        <SiteFooter />
      </main>
    );
  }

  // Форма заказа
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden isolate">
      <SiteHeader />
      <CometField count={8} />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2">🌟 Персональная натальная карта</h1>
        <p className="text-slate-400 mb-8">
          Глубокий AI-анализ вашей личности на основе даты, времени и места рождения
        </p>

        {/* Выбор тарифа */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setPlanSlug("natal-chart-once")}
            className={`p-5 rounded-2xl border text-left transition ${
              planSlug === "natal-chart-once"
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/10 bg-slate-900 hover:border-white/20"
            }`}
          >
            <div className="font-semibold mb-1">Разовая карта</div>
            <div className="text-2xl font-bold text-violet-400 mb-2"><span className="text-sm text-slate-500 line-through mr-2">160 ₽</span>49 ₽</div>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>✓ Полная интерпретация</li>
              <li>✓ Характер и психотип</li>
              <li>✓ Карьера, деньги, любовь</li>
            </ul>
          </button>
          <button
            onClick={() => setPlanSlug("natal-chart-weekly")}
            className={`p-5 rounded-2xl border text-left transition ${
              planSlug === "natal-chart-weekly"
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/10 bg-slate-900 hover:border-white/20"
            }`}
          >
            <div className="font-semibold mb-1">Карта + подписка</div>
            <div className="text-2xl font-bold text-violet-400 mb-2"><span className="text-sm text-slate-500 line-through mr-2">640 ₽</span>299 ₽<span className="text-sm text-slate-400">/мес</span></div>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>✓ Всё из разовой карты</li>
              <li>✓ 4 гороскопа в месяц</li>
              <li>✓ На основе вашей карты</li>
            </ul>
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoggedIn && (
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-violet-500 outline-none"
                placeholder="your@email.com"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Дата рождения *</label>
              <input
                type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Время рождения</label>
              <input
                type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-violet-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Пол</label>
              <select
                value={gender} onChange={e => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-violet-500 outline-none"
              >
                <option value="">Не указывать</option>
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Город</label>
              <input
                type="text" value={city} onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 focus:border-violet-500 outline-none"
                placeholder="Москва"
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          {/* Чекбоксы соглашений */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreeOffer} onChange={e => setAgreeOffer(e.target.checked)} className="mt-1 accent-violet-500" />
              <span className="text-sm text-slate-300">
                Я заказываю персональную Натальную карту и соглашаюсь с условиями её получения (
                <Link href="/terms" className="text-violet-400 underline" target="_blank">Публичная оферта</Link>, {" "}
                <Link href="/terms" className="text-violet-400 underline" target="_blank">Пользовательское соглашение</Link>, {" "}
                <Link href="/terms" className="text-violet-400 underline" target="_blank">оплата и возвраты</Link>). *
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreePersonalData} onChange={e => setAgreePersonalData(e.target.checked)} className="mt-1 accent-violet-500" />
              <span className="text-sm text-slate-300">
                Я даю отдельное согласие на обработку персональных данных в соответствии с текстом (
                <Link href="/terms" className="text-violet-400 underline" target="_blank">Согласие на обработку персональных данных</Link>, {" "}
                <Link href="/terms" className="text-violet-400 underline" target="_blank">Политика конфиденциальности</Link>). *
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={weeklyOptIn} onChange={e => setWeeklyOptIn(e.target.checked)} className="mt-1 accent-violet-500" />
              <span className="text-sm text-slate-300">
                Я хочу получать персональный AI-гороскоп по натальной карте каждую неделю и соглашаюсь с условиями подписки. (
                <Link href="/terms" className="text-violet-400 underline" target="_blank">Публичная оферта</Link>, {" "}
                <Link href="/terms" className="text-violet-400 underline" target="_blank">Пользовательское соглашение</Link>, {" "}
                <Link href="/terms" className="text-violet-400 underline" target="_blank">оплата и возвраты</Link>).
                <span className="text-slate-500 block mt-1">Если не поставите галочку — получите карту разово.</span>
              </span>
            </label>
          </div>

          <button
            type="submit" disabled={submitting || !agreeOffer || !agreePersonalData}
            className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 font-semibold text-lg transition"
          >
            {submitting ? "Переход к оплате..." : `Оплатить ${planSlug === "natal-chart-once" ? "49 ₽" : "299 ₽/мес"}`}
          </button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
