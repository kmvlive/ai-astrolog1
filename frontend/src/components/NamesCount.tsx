"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function NamesCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/names/count`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.count && setCount(d.count))
      .catch(() => {});
  }, []);

  return <>{(count ?? 0).toLocaleString("ru-RU")}</>;
}
