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
  themeColor: "#0f0a1e",
  title: "AI Астролог — персональные гороскопы на основе натальной карты",
  description: "Бесплатные ежедневные и персональные гороскопы от AI. Точные прогнозы на основе вашей натальной карты и лунных циклов. Узнайте своё будущее!",
  keywords: ["персональный гороскоп", "натальная карта", "AI астролог", "бесплатный гороскоп", "прогноз на сегодня"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/favicon.svg", type: "image/svg+xml" },
  },
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
      <Suspense><ReferralTracker /></Suspense>
        <PwaBanner />
        {children}
        <PopupNotification />
        <AnalyticsCounters />
      </body>
    </html>
  );
}

import ScrollMeter from "./dev/ScrollMeter";
// В <body> добавить <ScrollMeter /> рядом с PwaBanner
