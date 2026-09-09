import DivinationPage from "../_components/DivinationPage";

export const metadata = {
  title: "☕ Гадание на кофейной гуще онлайн | AI Астролог",
  description: "Традиционное гадание на кофейной гуще — образы и символы. Бесплатно онлайн.",
};

export default function Page() {
  return (
    <DivinationPage
      type="coffee-grounds"
      title="На кофейной гуще"
      emoji="☕"
      description="Традиционное гадание — образы и символы в вашей чашке кофе"
      gradient="from-stone-400 via-amber-600 to-orange-700"
      placeholder="Что хотите узнать? Задайте вопрос..."
    />
  );
}
