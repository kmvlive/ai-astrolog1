import DivinationPage from "../_components/DivinationPage";

export const metadata = {
  title: "🃏 Таро Да/Нет онлайн — быстрый ответ на вопрос | AI Астролог",
  description: "Онлайн-гадание Таро Да/Нет — одна карта, чёткий ответ. Бесплатно, без регистрации.",
};

export default function Page() {
  return (
    <DivinationPage
      type="tarot-yes-no"
      title="Таро Да/Нет"
      emoji="🃏"
      description="Задайте вопрос — одна карта Старших Арканов даст чёткий ответ"
      gradient="from-purple-400 via-fuchsia-400 to-violet-400"
      placeholder="Стоит ли мне менять работу? Позвонит ли он? Принять предложение?"
    />
  );
}
