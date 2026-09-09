import DivinationPage from "../_components/DivinationPage";

export const metadata = {
  title: "✝️ Кельтский крест — расклад на 10 карт онлайн | AI Астролог",
  description: "Классический расклад Кельтский крест на 10 карт Таро онлайн. Бесплатно.",
};

export default function Page() {
  return (
    <DivinationPage
      type="celtic-cross"
      title="Кельтский крест"
      emoji="✝️"
      description="Классический расклад на 10 карт — глубокий анализ ситуации со всех сторон"
      gradient="from-emerald-400 via-teal-400 to-cyan-400"
      placeholder="Опишите ситуацию или задайте вопрос..."
    />
  );
}
