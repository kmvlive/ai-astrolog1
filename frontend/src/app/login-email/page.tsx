"use client";

import CometField from "@/components/CometField";

import { useState } from "react";

const API_URL = "";

export default function LoginEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage({
        type: data.success ? "success" : "error",
        text: data.message || "Ошибка",
      });
    } catch {
      setMessage({ type: "error", text: "Ошибка соединения" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-10 text-center">
          <div className="text-6xl mb-3">🔑</div>
          <h1 className="text-white text-2xl font-bold">Вход по email</h1>
          <p className="text-amber-100 mt-2">Без пароля — пришлём ссылку для входа</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ваш@email.ru"
            className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? "Отправляем..." : "📬 Прислать ссылку"}
          </button>
          {message && (
            <p className={`text-center ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}
          <p className="text-center text-slate-500 text-sm">
            <a href="/login" className="hover:text-amber-400">← Войти с паролем</a>
          </p>
        </form>
      </div>
    </div>
  );
}
