import { Metadata } from "next";

export const metadata: Metadata = {
  title: "🃏 22 старших аркана Таро — значения и толкования | AI Астролог",
  description: "Полный справочник 22 старших арканов Таро: символика, толкование и влияние на судьбу. Маг, Жрица, Императрица и все арканы с описаниями.",
  openGraph: {
    title: "🃏 22 старших аркана Таро — полный справочник",
    description: "Символика, толкование и влияние каждого аркана на судьбу человека.",
    type: "website",
    locale: "ru_RU",
    siteName: "AI Астролог",
  },
  twitter: {
    card: "summary_large_image",
    title: "🃏 22 старших аркана Таро",
    description: "Полный справочник значений всех старших арканов",
  },
};

export default function ArcanaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
