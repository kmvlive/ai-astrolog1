import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Ежедневные аффирмации для вдохновения — AI Астролог",
    template: "%s | Аффирмации — AI Астролог"
  },
  description: "Получайте новую вдохновляющую аффирмацию каждый день. Позитивные установки для гармонии, успеха и хорошего настроения.",
  keywords: ["аффирмации", "ежедневные аффирмации", "вдохновение", "позитив", "мотивация"],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
