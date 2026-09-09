import { Metadata } from "next";

export const metadata: Metadata = {
  title: "🔮 Онлайн-гадания — Таро, руны, кофейная гуща | AI Астролог",
  description: "7 бесплатных онлайн-гаданий: Таро Да/Нет, Кельтский крест, на любовь, будущее, руны, кофейная гуща. AI-оракул.",
  keywords: "гадание онлайн, таро онлайн, гадание бесплатно, кельтский крест, руны, кофейная гуща",
  openGraph: {
    title: "🔮 Онлайн-гадания — 7 способов заглянуть в будущее",
    description: "Таро, руны, кофейная гуща — бесплатные онлайн-гадания с AI-интерпретацией.",
    url: "https://my.neiro-astro.ru/divinations",
    siteName: "AI Астролог",
    locale: "ru_RU",
    type: "website",
  },
};

export default function DivinationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
