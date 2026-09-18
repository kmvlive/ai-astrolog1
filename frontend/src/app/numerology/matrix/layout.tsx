import { Metadata } from "next";

export const metadata: Metadata = {
  title: "🔮 Матрица судьбы — расчёт аркана по дате рождения | AI Астролог",
  description: "Узнайте свой главный аркан Таро по дате рождения. Раскройте жизненный путь, таланты и кармические задачи. Бесплатный онлайн-калькулятор.",
  openGraph: {
    title: "🔮 Матрица судьбы — ваш аркан по дате рождения",
    description: "Раскройте тайны судьбы через числа. Бесплатный расчёт аркана Таро по дате рождения.",
    type: "website",
    locale: "ru_RU",
    siteName: "AI Астролог",
  },
  twitter: {
    card: "summary_large_image",
    title: "🔮 Матрица судьбы — ваш аркан",
    description: "Узнайте свой жизненный путь через главный аркан Таро",
  },
};

export default function MatrixLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
