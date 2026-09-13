import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мой профиль: данные рождения и настройки — AI Астролог",
  description: "Настройте данные рождения для точных персональных гороскопов. Укажите дату, время и место рождения.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
