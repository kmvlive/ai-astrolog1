import DivinationPage from "../_components/DivinationPage";

export const metadata = {
  title: "🔮 Таро на будущее онлайн — прогноз на год | AI Астролог",
  description: "Гадание Таро на будущее: неделя, месяц, полгода, год. Бесплатно онлайн.",
};

export default function Page() {
  return (
    <DivinationPage
      type="tarot-future"
      title="Таро на будущее"
      emoji="🔮"
      description="Прогноз на неделю, месяц, полгода и год — 5 карт раскроют путь"
      gradient="from-violet-400 via-purple-400 to-indigo-400"
      placeholder="Что вас интересует? Карьера, переезд, здоровье?"
    />
  );
}
