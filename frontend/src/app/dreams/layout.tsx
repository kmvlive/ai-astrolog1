import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сонник онлайн: толкование снов бесплатно — AI Астролог",
  description: "Узнайте значение вашего сна в нашем бесплатном соннике. Тысячи толкований снов с подробным описанием и предсказаниями.",
  keywords: ["сонник", "толкование снов", "значение сна", "приснилось", "сонник онлайн"],
};

export default function DreamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
