import { Metadata } from "next";

export const metadata: Metadata = {
  title: "💕 Матрица совместимости — гороскоп пары по датам рождения | AI Астролог",
  description: "Проверьте совместимость по датам рождения. Узнайте точки гармонии и зоны роста в отношениях. Бесплатный онлайн-калькулятор арканов пары.",
  openGraph: {
    title: "💕 Матрица совместимости — гороскоп вашей пары",
    description: "Сравните арканы двух людей. Узнайте гармонию и зоны роста в отношениях.",
    type: "website",
    locale: "ru_RU",
    siteName: "AI Астролог",
  },
  twitter: {
    card: "summary_large_image",
    title: "💕 Матрица совместимости пары",
    description: "Проверьте гармонию отношений по датам рождения",
  },
};

export default function CompatibilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
