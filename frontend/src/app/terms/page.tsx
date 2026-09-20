import CometField from "@/components/CometField";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Условия оказания услуг — AI Астролог",
  description: "Условия использования сервиса AI Астролог",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen text-white py-12 relative overflow-hidden isolate">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-sm text-slate-400 hover:text-violet-400 mb-6 inline-block">
          ← Главная
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Условия оказания услуг</h1>
        
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
            <p className="text-slate-300 mb-4">
              Настоящие условия регулируют использование сервиса "AI Астролог" (далее — Сервис).
              Используя Сервис, вы соглашаетесь с настоящими условиями.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">2. Предоставляемые услуги</h2>
            <p className="text-slate-300 mb-4">Сервис предоставляет:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Персональные гороскопы на основе искусственного интеллекта</li>
              <li>Толкования снов</li>
              <li>Значения имён и анализ совместимости</li>
              <li>Гадания на Таро и другие формы предсказаний</li>
              <li>Астрологические календари и расчёты</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">3. Характер предоставляемой информации</h2>
            <p className="text-slate-300 mb-4">
              Все материалы Сервиса носят развлекательный и информационный характер.
              Сервис не предоставляет медицинских, юридических, финансовых или иных профессиональных консультаций.
              Пользователь принимает решения на основе предоставленной информации самостоятельно и несёт за них полную ответственность.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">4. Конфиденциальность</h2>
            <p className="text-slate-300 mb-4">
              Персональные данные (дата, время и место рождения) используются исключительно для предоставления
              персонализированных услуг и не передаются третьим лицам без согласия пользователя.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">5. Платные услуги</h2>
            <p className="text-slate-300 mb-4">
              Часть функций Сервиса доступна по подписке. Оплата производится через защищённые платёжные системы.
              Возврат средств осуществляется в соответствии с действующим законодательством РФ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">6. Интеллектуальная собственность</h2>
            <p className="text-slate-300 mb-4">
              Все материалы, опубликованные на портале, являются интеллектуальной собственностью владельца Сервиса.
              Копирование, распространение или использование материалов без письменного разрешения запрещено.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">7. Ограничение ответственности</h2>
            <p className="text-slate-300 mb-4">
              Владелец Сервиса не несёт ответственности за решения, принятые пользователем на основе предоставленной информации.
              Сервис предоставляется "как есть" без каких-либо гарантий.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">8. Возрастные ограничения</h2>
            <p className="text-slate-300 mb-4">
              Сервис предназначен для пользователей старше 18 лет.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">9. Контакты</h2>
            <p className="text-slate-300 mb-4">
              ИП Прокопенко А.В.<br/>
              ИНН 263211995820<br/>
              Свидетельство от 17.10.2007
            </p>
          </section>

          <p className="text-sm text-slate-500 mt-12">
            Последнее обновление: сентябрь 2026
          </p>
        </div>
      </div>
    </main>
  );
}
