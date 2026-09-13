import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsCounters from "@/components/AnalyticsCounters";
import ReferralTracker from "@/components/ReferralTracker";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "AI Астролог — персональные гороскопы на основе натальной карты",
  description: "Бесплатные ежедневные и персональные гороскопы от AI. Точные прогнозы на основе вашей натальной карты и лунных циклов. Узнайте своё будущее!",
  keywords: ["персональный гороскоп", "натальная карта", "AI астролог", "бесплатный гороскоп", "прогноз на сегодня"],
};

export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
      <Suspense><ReferralTracker /></Suspense>
        {children}
        <AnalyticsCounters />
      </body>
    </html>
  );
}
