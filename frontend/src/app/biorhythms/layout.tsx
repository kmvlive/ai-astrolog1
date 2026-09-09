import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Биоритмы на сегодня — рассчитать онлайн | AI Астролог",
  description: "Рассчитайте физические, эмоциональные и интеллектуальные биоритмы по дате рождения. График на 30 дней и персональный совет от AI.",
  openGraph: {
    title: "📊 Биоритмы на сегодня — рассчитать онлайн",
    description: "Узнайте свои биоритмы и получите совет дня от AI астролога.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
