import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Приведи друзей — получи бесплатные гороскопы | AI Астролог",
  description: "Пригласите 5 друзей и получите 3 месяца бесплатных персональных гороскопов. Партнёрская программа AI Астролога.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
