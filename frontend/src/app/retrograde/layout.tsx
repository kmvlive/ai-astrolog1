import { Metadata } from "next";

export const metadata: Metadata = {
  title: "☿ Ретроградные планеты — текущие периоды и влияние | AI Астролог",
  description: "Узнайте какие планеты сейчас в ретроградном движении. Полный календарь ретроградов с описанием влияния на жизнь, отношения и дела.",
  openGraph: {
    title: "☿ Ретроградные планеты — текущие периоды",
    description: "Какие планеты сейчас в ретрограде и как это влияет на вашу жизнь",
    type: "website",
    locale: "ru_RU",
    siteName: "AI Астролог",
  },
  twitter: {
    card: "summary_large_image",
    title: "☿ Ретроградные планеты",
    description: "Текущие периоды ретроградов и их влияние",
  },
};

export default function RetrogradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
