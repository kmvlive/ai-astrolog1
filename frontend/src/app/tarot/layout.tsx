import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Карта Таро дня — послание на сегодня | AI Астролог",
  description: "Бесплатная карта дня Таро: значение карты и послание на сегодня. Старшие Арканы подскажут, что важно именно сейчас.",
  openGraph: {
    title: "🎴 Карта Таро дня — послание на сегодня",
    description: "Узнайте свою карту дня и получите послание от Старших Арканов.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
