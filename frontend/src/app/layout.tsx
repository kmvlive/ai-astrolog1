import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Астролог - Персональные гороскопы AI",
  description: "Сервис персональных гороскопов с искусственным интеллектом. Индивидуальные прогнозы по дате рождения.",
  keywords: ["гороскоп", "астрология", "AI", "прогноз", "натальная карта"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
