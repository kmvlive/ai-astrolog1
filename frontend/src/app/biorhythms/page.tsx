"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButtons from "@/components/ShareButtons";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function BiorhythmsPage() {
  const [birthDate, setBirthDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const calc = (days: number, period: number) => Math.sin(2 * Math.PI * days / period) * 100;

  useEffect(() => {
    const saved = localStorage.getItem("birth_date");
    const token = localStorage.getItem("auth_token");
    
    // Если авторизован — тянем дату из профиля
    if (token && !saved) {
      fetch(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.profile?.birth_date) {
            const bd = String(d.profile.birth_date).slice(0, 10);
            setBirthDate(bd);
            localStorage.setItem("birth_date", bd);
          } else if (saved) {
            setBirthDate(saved);
          }
        })
        .catch(() => {
          if (saved) setBirthDate(saved);
        });
    } else if (saved) {
      setBirthDate(saved);
    }
  }, []);

  
    // Подсветка если автозагружено из профиля
    const token = localStorage.getItem("auth_token");
    if (token) {
      setTimeout(() => {
        const el = document.getElementById("bio-input");
        if (el) el.classList.add("bio-auto-loaded");
      }, 100);
    }
const load = async () => {
    if (!birthDate) return;
    setLoading(true);
    localStorage.setItem("birth_date", birthDate);

    const today = await fetch(`${API}/api/biorhythms?birth_date=${birthDate}`)
      .then(r => r.ok ? r.json() : null);
    setData(today);

    const birth = new Date(birthDate);
    const todayDate = new Date();
    const days = Math.floor((todayDate.getTime() - birth.getTime()) / 86400000);
    const forecast: any[] = [];
    for (let i = -3; i <= 27; i++) {
      const d = days + i;
      const date = new Date(todayDate);
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
        day: d,
        physical: calc(d, 23),
        emotional: calc(d, 28),
        intellectual: calc(d, 33),
        today: i === 0,
      });
    }
    setForecast(forecast);
    setLoading(false);

    // AI-совет
    setAdvice(null);
    setAdviceLoading(true);
    fetch(`${API}/api/biorhythms/advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ physical: today.physical, emotional: today.emotional, intellectual: today.intellectual }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setAdvice(d?.advice || null))
      .catch(() => {})
      .finally(() => setAdviceLoading(false));
  };

  useEffect(() => {
    if (birthDate) load();
  }, [birthDate]);

  const maxVal = 100;
  const h = 180;
  const w = 800;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Биоритмы</h1>
          <p className="text-slate-400">Физический, эмоциональный и интеллектуальный циклы</p>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mb-8" id="bio-input">
          <label className="block text-sm text-slate-400 mb-2">Ваша дата рождения</label>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={load}
              disabled={loading || !birthDate}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold transition"
            >
              {loading ? "..." : "Рассчитать"}
            </button>
          </div>
        </div>

        {data && (
          <>
            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bio-card bg-gradient-to-br from-violet-900/40 to-slate-900 border border-violet-500/30 rounded-2xl p-5 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Общий</div>
                <div className="text-4xl font-bold text-violet-300">{data.average}%</div>
                <div className="text-xs text-slate-400 mt-2">{data.date}</div>
              </div>
              <div className="bio-card bg-gradient-to-br from-red-900/30 to-slate-900 border border-red-500/30 rounded-2xl p-5 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">💪 Физический</div>
                <div className="text-4xl font-bold text-red-300">{data.physical}%</div>
                <div className="text-xs text-slate-400 mt-2">23 дня</div>
              </div>
              <div className="bio-card bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-500/30 rounded-2xl p-5 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">💙 Эмоциональный</div>
                <div className="text-4xl font-bold text-blue-300">{data.emotional}%</div>
                <div className="text-xs text-slate-400 mt-2">28 дней</div>
              </div>
              <div className="bio-card bg-gradient-to-br from-yellow-900/30 to-slate-900 border border-yellow-500/30 rounded-2xl p-5 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">🧠 Интеллектуальный</div>
                <div className="text-4xl font-bold text-yellow-300">{data.intellectual}%</div>
                <div className="text-xs text-slate-400 mt-2">33 дня</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 overflow-x-auto mb-8">
              <h3 className="font-bold mb-4">Прогноз на 30 дней</h3>
              <svg viewBox={`0 0 ${w} ${h + 40}`} className="w-full" style={{ minWidth: 600 }}>
                <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />

                {["physical", "emotional", "intellectual"].map((key, idx) => {
                  const colors = ["#ef4444", "#3b82f6", "#eab308"];
                  const points = forecast.map((f, i) => {
                    const x = (i / (forecast.length - 1)) * w;
                    const y = h / 2 - (f[key] / maxVal) * (h / 2);
                    return `${x},${y}`;
                  }).join(" ");
                  return <polyline key={key} points={points} fill="none" stroke={colors[idx]} strokeWidth="2" className="bio-graph-line" />;
                })}

                {forecast.findIndex(f => f.today) >= 0 && (
                  <line
                    x1={(forecast.findIndex(f => f.today) / (forecast.length - 1)) * w}
                    y1="0"
                    x2={(forecast.findIndex(f => f.today) / (forecast.length - 1)) * w}
                    y2={h}
                    stroke="#a78bfa"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}

                {forecast.filter((_, i) => i % 6 === 0).map((f, i) => {
                  const idx = forecast.indexOf(f);
                  const x = (idx / (forecast.length - 1)) * w;
                  return (
                    <text key={i} x={x} y={h + 25} fill="#94a3b8" fontSize="12" textAnchor="middle">
                      {f.date}
                    </text>
                  );
                })}
              </svg>

              <div className="flex flex-wrap gap-4 justify-center mt-4 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Физический</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Эмоциональный</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Интеллектуальный</div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-8 text-sm text-slate-400 leading-relaxed">
              <div className="font-semibold text-white mb-2">💡 О биоритмах</div>
              Биоритмы — теория о циклических изменениях состояния человека. Три основных цикла начинаются с момента рождения:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Физический</strong> (23 дня) — выносливость, сила, координация</li>
                <li><strong>Эмоциональный</strong> (28 дней) — настроение, творчество, чувствительность</li>
                <li><strong>Интеллектуальный</strong> (33 дня) — память, концентрация, аналитика</li>
              </ul>
              Положительные значения — подъём, отрицательные — восстановление. Критические дни (0%) — будьте осторожны.
            </div>

            <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/20 border border-violet-500/30 rounded-2xl p-6 mb-8">
              <h3 className="font-bold mb-3 flex items-center gap-2">🌟 Совет на день от AI астролога</h3>
              {adviceLoading ? (
                <div className="text-slate-400 animate-pulse">AI анализирует ваши биоритмы...</div>
              ) : advice ? (
                <p className="bio-advice text-slate-200 leading-relaxed">{advice}</p>
              ) : null}
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-center font-semibold mb-4">Поделиться результатами</h3>
              <ShareButtons title={`Мои биоритмы на сегодня: общий ${data.average}%, физический ${data.physical}%, эмоциональный ${data.emotional}%, интеллектуальный ${data.intellectual}%`} />
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
