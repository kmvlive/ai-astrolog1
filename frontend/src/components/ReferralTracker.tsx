"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[A-Z0-9]{6,16}$/i.test(ref)) {
      // Сохраняем на 30 дней
      localStorage.setItem("referral_code", ref.toUpperCase());
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `referral_code=${ref.toUpperCase()}; expires=${expires}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
