import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация — создайте аккаунт AI Астролога бесплатно",
  description: "Зарегистрируйтесь бесплатно и получите персональный гороскоп на основе вашей натальной карты. Начните узнавать своё будущее уже сегодня!",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
