"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = "";

function MagicLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ranRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Проверяем ссылку...");
  const [debug, setDebug] = useState("");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const payload = {
      uid: searchParams.get("uid"),
      expires: searchParams.get("expires"),
      signature: searchParams.get("signature"),
      token: searchParams.get("token"),
    };

    setDebug("params: " + JSON.stringify(payload).slice(0, 200));

    if ((!payload.uid || !payload.signature) && !payload.token) {
      setStatus("error");
      setMessage("Ссылка недействительна (нет параметров).");
      return;
    }

    fetch(`${API_URL}/api/magic-link/verify`, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (r) => {
        const raw = await r.text();
        let data: any = {};
        try { data = JSON.parse(raw); } catch {}

        setDebug(`status=${r.status} body=${raw.slice(0, 250)}`);

        if (!r.ok || !data.success) {
          setStatus("error");
          setMessage(data.message || `Сервер вернул ${r.status}`);
          return;
        }

        localStorage.setItem("auth_token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        setStatus("success");

        if (data.has_password) {
          setMessage("Добро пожаловать! Перенаправляем в кабинет...");
          setTimeout(() => router.push("/dashboard"), 1200);
        } else {
          setMessage("Вы вошли! Осталось придумать пароль.");
          setTimeout(() => router.push("/set-password"), 1200);
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage("Ошибка соединения: " + (err.message || ""));
        setDebug("fetch error: " + err.message);
      });
  }, [searchParams, router]);

  const icon = status === "loading" ? "⏳" : status === "success" ? "✅" : "😔";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl text-center">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-10">
          <div className="text-6xl mb-3">{icon}</div>
          <h1 className="text-white text-2xl font-bold">
            {status === "loading" && "Входим..."}
            {status === "success" && "Успешно!"}
            {status === "error" && "Не получилось"}
          </h1>
        </div>
        <div className="p-8">
          <p className="text-slate-300 text-lg mb-4">{message}</p>
          {debug && (
            <p className="text-xs text-slate-500 break-all mb-4 font-mono text-left bg-slate-900 p-2 rounded">
              {debug}
            </p>
          )}
          {status === "error" && (
            <a
              href="/login-email"
              className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl"
            >
              Запросить новую ссылку
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <MagicLoginContent />
    </Suspense>
  );
}
