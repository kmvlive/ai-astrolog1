import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Тарифы — AI Календарь',
  description: 'Выбери подходящий тариф: Free, Plus или Pro. Начни бесплатно, обновляйся когда понадобится.',
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'навсегда',
      desc: 'Для знакомства с сервисом',
      features: [
        'До 3 календарей',
        'Напоминания на email',
        'Базовые события',
        'Мобильная версия',
        'Синхронизация между устройствами',
      ],
      cta: 'Начать бесплатно',
      popular: false,
    },
    {
      name: 'Plus',
      price: '199',
      period: '/ месяц',
      desc: 'Для активного планирования',
      features: [
        'До 10 календарей',
        'Email + Telegram уведомления',
        'Повторяющиеся события',
        'Категории и теги',
        'Импорт из Google Calendar',
        'Приоритетная поддержка',
        'Цветовые темы',
      ],
      cta: 'Попробовать Plus',
      popular: true,
    },
    {
      name: 'Pro',
      price: '499',
      period: '/ месяц',
      desc: 'Без ограничений',
      features: [
        'Неограниченно календарей',
        'Все каналы + VK Max',
        'AI-астрологические события',
        'Публичные календари с шарингом',
        'Семейный доступ (5 человек)',
        'API для интеграций',
        'Виджеты для сайтов',
        'Персональный менеджер',
      ],
      cta: 'Выбрать Pro',
      popular: false,
    },
  ]

  return (
    <main>
      <Header />
      
      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition mb-8">
          <span>←</span> На главную
        </Link>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Простые и <span className="bg-gradient-to-r from-astro-purple to-astro-blue bg-clip-text text-transparent">честные тарифы</span>
        </h1>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          Начни бесплатно. Обновляйся когда понадобится. Без скрытых платежей, отмена в один клик.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-2xl border ${
                plan.popular
                  ? 'border-astro-purple bg-gradient-to-br from-astro-purple/10 to-astro-blue/5 shadow-xl shadow-astro-purple/20 scale-105'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-astro-purple to-astro-blue text-xs font-semibold">
                  Популярный
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-white/60 ml-2">₽{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 min-h-[280px]">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-astro-purple mt-0.5">✓</span>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center py-3 rounded-xl font-semibold transition ${
                  plan.popular
                    ? 'btn-gradient text-white'
                    : 'border border-white/20 hover:bg-white/5 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Сравнение тарифов</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-white/60 font-normal">Возможность</th>
                <th className="text-center py-4 px-4">Free</th>
                <th className="text-center py-4 px-4 text-astro-purple">Plus</th>
                <th className="text-center py-4 px-4">Pro</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ['Календарей', '3', '10', '∞'],
                ['Email уведомления', '✓', '✓', '✓'],
                ['Telegram уведомления', '—', '✓', '✓'],
                ['VK Max уведомления', '—', '—', '✓'],
                ['Повторяющиеся события', '—', '✓', '✓'],
                ['Импорт из Google', '—', '✓', '✓'],
                ['Публичные календари', '—', '—', '✓'],
                ['Семейный доступ', '—', '—', '✓ (5 чел.)'],
                ['API доступ', '—', '—', '✓'],
                ['Поддержка', 'Email', 'Приоритет', 'Персональная'],
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-4 px-4 text-white/80">{row[0]}</td>
                  <td className="py-4 px-4 text-center text-white/60">{row[1]}</td>
                  <td className="py-4 px-4 text-center text-astro-purple font-semibold">{row[2]}</td>
                  <td className="py-4 px-4 text-center text-white/80">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Частые вопросы</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Можно ли отменить подписку?',
              a: 'Да, в любой момент в настройках аккаунта. Доступ сохранится до конца оплаченного периода.',
            },
            {
              q: 'Что будет с моими данными при отмене?',
              a: 'Все календари и события останутся доступны в режиме просмотра. Можно экспортировать в iCal.',
            },
            {
              q: 'Есть ли бесплатный пробный период для платных тарифов?',
              a: 'Да, первые 7 дней Plus и Pro доступны бесплатно. Карту запрашиваем только после пробного периода.',
            },
            {
              q: 'Как работает семейный доступ?',
              a: 'На тарифе Pro можно пригласить до 5 человек. У каждого будет свой личный календарь + общий семейный.',
            },
            {
              q: 'Какие способы оплаты принимаете?',
              a: 'Банковские карты (Visa, Mastercard, МИР), СБП, ЮMoney. Для юр.лиц — оплата по счёту.',
            },
          ].map((faq, i) => (
            <details
              key={i}
              className="group p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-semibold">{faq.q}</span>
                <span className="text-astro-purple group-open:rotate-45 transition-transform text-2xl">+</span>
              </summary>
              <p className="mt-4 text-white/70 text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="p-12 rounded-3xl border border-astro-purple/30 bg-gradient-to-br from-astro-purple/10 to-astro-blue/5">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Не знаешь какой тариф выбрать?</h2>
          <p className="text-white/70 mb-8">Начни с Free — этого хватит чтобы понять, подходит ли тебе сервис</p>
          <Link href="/signup" className="btn-gradient inline-block px-8 py-3.5 rounded-xl font-semibold text-white">
            Создать первый календарь бесплатно
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
