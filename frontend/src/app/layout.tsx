import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsCounters from "@/components/AnalyticsCounters";
import ReferralTracker from "@/components/ReferralTracker";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "AI Астролог — персональные гороскопы",
  description: "Ежедневные и персональные гороскопы на основе AI. Бесплатные прогнозы для всех 12 знаков зодиака.",
  keywords: ["гороскоп", "астрология", "AI", "прогноз", "натальная карта"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/favicon.svg", type: "image/svg+xml" },
  },
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
