import DivinationPage from "../_components/DivinationPage";
import RuneOfDay from "./RuneOfDay";

export const metadata = {
  title: "ᚱ Гадание на рунах онлайн — скандинавские руны | AI Астролог",
  description: "Гадание на рунах Старшего Футарка онлайн. Руна дня и расклад на три руны. Мудрость предков. Бесплатно.",
};

export default function Page() {
  return (
    <DivinationPage
      type="runes"
      title="На рунах"
      emoji="ᚱ"
      description="Три руны Старшего Футарка — мудрость скандинавских предков"
      gradient="from-sky-400 via-blue-400 to-indigo-400"
      placeholder="Задайте вопрос рунам..."
      topContent={<RuneOfDay />}
    />
  );
}
