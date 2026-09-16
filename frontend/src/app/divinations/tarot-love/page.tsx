import CometField from "@/components/CometField";
import DivinationPage from "../_components/DivinationPage";

export const metadata = {
  title: "💕 Таро на любовь онлайн — расклад на отношения | AI Астролог",
  description: "Гадание Таро на любовь и отношения — прошлое, настоящее, будущее. Бесплатно.",
};

export default function Page() {
  return (
    <DivinationPage
      type="tarot-love"
      title="Таро на любовь"
      emoji="💕"
      description="Расклад на отношения: что было, что есть, что будет в любви"
      gradient="from-rose-400 via-pink-400 to-red-400"
      placeholder="Вопрос о любви, отношениях, партнёре..."
    />
  );
}
