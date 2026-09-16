import CometField from "@/components/CometField";
import DivinationPage from "../_components/DivinationPage";

export const metadata = {
  title: "⭐ Таро по дате рождения — персональная карта | AI Астролог",
  description: "Персональная карта Таро и число судьбы по дате рождения. Бесплатно.",
};

export default function Page() {
  return (
    <DivinationPage
      type="tarot-birthdate"
      title="Таро по дате рождения"
      emoji="⭐"
      description="Ваша персональная карта Старших Арканов и число судьбы"
      gradient="from-amber-400 via-orange-400 to-yellow-400"
      hasQuestion={false}
      hasBirthdate={true}
    />
  );
}
