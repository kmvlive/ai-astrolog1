import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тарифы AI Астролога: бесплатные и премиум гороскопы",
  description: "Выберите подходящий тариф: бесплатные ежедневные гороскопы или премиум персональные прогнозы. Узнайте цены и возможности.",
  keywords: ["тарифы гороскоп", "платный гороскоп", "премиум астрология", "цена гороскопа"],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
