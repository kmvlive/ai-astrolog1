import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет: ваши гороскопы и настройки — AI Астролог",
  description: "Управляйте своими подписками, настройками гороскопов и персональными прогнозами в личном кабинете AI Астролога.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
