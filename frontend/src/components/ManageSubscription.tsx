"use client";

import { useState } from "react";

const API_URL = "";

export default function ManageSubscription() {
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
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
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
    <div className="mt-4 mb-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-2">⚙️ Уже подписаны?</h3>
      <p className="text-sm text-slate-400 mb-4">
        Войдите по email, чтобы управлять рассылкой: типы гороскопов, время, отписка.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ваш@email.ru"
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition disabled:opacity-50 text-sm"
        >
          {loading ? "Отправляем..." : "🔑 Получить ссылку для входа"}
        </button>
        {message && (
          <p className={`text-sm text-center ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}
