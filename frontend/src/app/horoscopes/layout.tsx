import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Гороскопы на сегодня для всех знаков зодиака — AI Астролог",
    template: "%s | Гороскопы — AI Астролог"
  },
  description: "Читайте бесплатные гороскопы на сегодня для всех 12 знаков зодиака. Точные предсказания от AI на основе астрологических расчётов.",
  keywords: ["гороскоп на сегодня", "знаки зодиака", "овен гороскоп", "телец гороскоп", "бесплатный гороскоп"],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
