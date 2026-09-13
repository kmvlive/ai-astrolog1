import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход в личный кабинет — AI Астролог",
  description: "Войдите в свой аккаунт AI Астролога для доступа к персональным гороскопам и настройкам.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
