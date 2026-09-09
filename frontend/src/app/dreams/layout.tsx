import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сонник онлайн — толкование снов | AI Астролог",
  description: "Сонник с сотнями толкований снов. Найдите свой символ или спросите AI — он растолкует любой сон бесплатно.",
  openGraph: {
    title: "🌙 Сонник онлайн — толкование снов",
    description: "Толкование снов из большой базы + AI для любых символов.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
