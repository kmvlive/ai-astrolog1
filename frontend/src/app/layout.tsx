import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsCounters from "@/components/AnalyticsCounters";
import PopupNotification from "@/components/PopupNotification";
import ReferralTracker from "@/components/ReferralTracker";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Астролог",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  title: "AI Астролог — персональные гороскопы на основе натальной карты",
  description: "Бесплатные ежедневные и персональные гороскопы от AI. Точные прогнозы на основе вашей натальной карты и лунных циклов. Узнайте своё будущее!",
  keywords: ["персональный гороскоп", "натальная карта", "AI астролог", "бесплатный гороскоп", "прогноз на сегодня"],
};

export const revalidate = 0;

import PwaBanner from "@/components/PwaBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
    <div className="star-field" aria-hidden="true">
      <div className="star-layer" />
      <div className="star-layer star-twinkle" />
    </div>
      <Suspense><ReferralTracker /></Suspense>
        <PwaBanner />
        {children}
        <PopupNotification />
        <AnalyticsCounters />
      </body>
    </html>
  );
}

export const viewport = {
  themeColor: "#0f0a1e",
};
