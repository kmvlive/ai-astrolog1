"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://my.neiro-astro.ru";

export default function DreamsCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/api/dreams/count`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.count && setCount(d.count))
      .catch(() => {});
  }, []);

  return <>{(count ?? 579).toLocaleString("ru-RU")}+</>;
}
