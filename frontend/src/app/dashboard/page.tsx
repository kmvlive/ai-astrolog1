"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Личный кабинет</h1>
            <p className="text-slate-400">Добро пожаловать, {user.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            Выйти
          </button>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">Ваш профиль</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Имя</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Дата регистрации</div>
              <div className="font-medium">{new Date(user.created_at).toLocaleDateString("ru-RU")}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">🔮 Ваши гороскопы</h2>
          <p className="text-slate-400 mb-4">
            Здесь будет список ваших подписок и последние сгенерированные гороскопы.
          </p>
          <button className="bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition">
            Получить гороскоп на сегодня
          </button>
        </div>

        <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-2">🎁 Пробный период</h2>
          <p className="text-slate-300 mb-4">
            У вас осталось <span className="text-violet-400 font-bold">7 дней</span> бесплатного доступа.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold transition"
          >
            Оформить подписку
          </Link>
        </div>
      </div>
    </main>
  );
}
