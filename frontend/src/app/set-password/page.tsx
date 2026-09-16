"use client";

import CometField from "@/components/CometField";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage({ type: "error", text: "Минимум 8 символов" });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Пароли не совпадают" });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/set-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ password, password_confirmation: confirm }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data.success) {
        setMessage({ 
          type: "error", 
          text: data.message || "Ошибка при сохранении пароля" 
        });
        return;
      }
      
      setMessage({ type: "success", text: "Пароль установлен! 🎉" });
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setMessage({ 
        type: "error", 
        text: "Ошибка соединения: " + (err.message || "попробуйте позже") 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-10 text-center">
          <div className="text-6xl mb-3">🔐</div>
          <h1 className="text-white text-2xl font-bold">Создайте пароль</h1>
          <p className="text-amber-100 mt-2">
            Чтобы входить в кабинет не только по ссылке из письма
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (мин. 8 символов)"
            className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Повторите пароль"
            className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? "Сохраняем..." : "💾 Создать пароль"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 text-slate-400 hover:text-white transition"
          >
            Пропустить →
          </button>
          {message && (
            <p className={`text-center ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
