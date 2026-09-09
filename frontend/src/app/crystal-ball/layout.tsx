import { Metadata } from "next";

export const metadata: Metadata = {
  title: "🔮 Хрустальный Шар — AI предсказание онлайн бесплатно | AI Астролог",
  description: "Задайте вопрос хрустальному шару и получите мистическое AI-предсказание. Древний оракул откроет завесу будущего. Бесплатно, без регистрации.",
  keywords: "хрустальный шар, предсказание онлайн, гадание бесплатно, AI оракул, предсказание судьбы, магический шар, гадание на будущее",
  openGraph: {
    title: "🔮 Хрустальный Шар — AI предсказание онлайн",
    description: "Задайте вопрос — древний оракул откроет завесу будущего. AI-предсказание за секунды.",
    url: "https://my.neiro-astro.ru/crystal-ball",
    siteName: "AI Астролог",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🔮 Хрустальный Шар — AI предсказание онлайн",
    description: "Задайте вопрос хрустальному шару и получите мистическое предсказание от AI-оракула.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CrystalBallLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
