import Link from 'next/link'

export default function PricingTeaser() {
  const plans = [
    { name: 'Free', price: '0', desc: '3 календаря, email' },
    { name: 'Plus', price: '199', desc: '10 календарей, Telegram' },
    { name: 'Pro', price: '499', desc: '∞ календарей, все каналы' },
  ]

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Тарифы для всех
        </h2>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">
          Начни бесплатно. Обновляйся когда понадобится.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border text-center transition hover:scale-105 ${
              i === 1
                ? 'border-astro-purple bg-gradient-to-br from-astro-purple/10 to-astro-blue/5'
                : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            <div className="text-sm text-white/60 mb-2">{plan.name}</div>
            <div className="text-4xl font-bold mb-2">
              {plan.price}<span className="text-lg text-white/60">₽</span>
            </div>
            <div className="text-sm text-white/60">{plan.desc}</div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/5 transition"
        >
          Сравнить тарифы подробно
          <span>→</span>
        </Link>
      </div>
    </section>
  )
}
