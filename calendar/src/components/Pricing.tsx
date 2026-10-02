import Link from 'next/link'

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'навсегда',
      desc: 'Для знакомства',
      features: ['3 календаря', 'Напоминания на email', 'Базовые события', 'Мобильная версия'],
      cta: 'Начать бесплатно',
      popular: false,
    },
    {
      name: 'Plus',
      price: '199',
      period: '/ месяц',
      desc: 'Для активных',
      features: ['10 календарей', 'Email + Telegram', 'Повторяющиеся события', 'Категории и теги', 'Импорт из Google', 'Поддержка приоритет'],
      cta: 'Попробовать Plus',
      popular: true,
    },
    {
      name: 'Pro',
      price: '499',
      period: '/ месяц',
      desc: 'Без ограничений',
      features: ['∞ календарей', 'Все каналы + VK Max', 'AI-астрологические события', 'Публичные календари', 'Семейный доступ (5 чел.)', 'API для интеграций'],
      cta: 'Выбрать Pro',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Простые и честные тарифы</h2>
        <p className="text-lg text-white/60">Начни бесплатно, обновляйся когда понадобится</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`relative p-8 rounded-2xl border ${
              plan.popular
                ? 'border-astro-purple bg-gradient-to-br from-astro-purple/10 to-astro-blue/5 shadow-xl shadow-astro-purple/20'
                : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-astro-purple to-astro-blue text-xs font-semibold">
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
            <ul className="space-y-3 mb-8">
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
  )
}
