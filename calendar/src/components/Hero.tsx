import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 mb-8">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        Новый сервис от команды AI Астролога
      </div>
      <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        Умные календари
        <br />
        <span className="bg-gradient-to-r from-astro-purple via-astro-blue to-astro-purple bg-clip-text text-transparent">
          с напоминаниями
        </span>
      </h1>
      <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
        Создавай красивые календари и получай напоминания туда, где удобно:
        email, Telegram или VK Max. 3 календаря бесплатно.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/signup" className="btn-gradient px-8 py-3.5 rounded-xl font-semibold text-white">
          Создать календарь бесплатно
        </Link>
        <Link href="#pricing" className="px-8 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/5 transition">
          Смотреть тарифы
        </Link>
      </div>

      {/* Превью календаря */}
      <div className="mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-astro-darker via-transparent to-transparent z-10"></div>
        <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur p-6 shadow-2xl shadow-astro-purple/20">
          <CalendarPreview />
        </div>
      </div>
    </section>
  )
}

function CalendarPreview() {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return (
    <div className="text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Октябрь 2026</div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-astro-purple/20 text-astro-purple">Личный</span>
          <span className="px-2 py-1 rounded bg-astro-blue/20 text-astro-blue">Работа</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-xs text-white/40 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
          const hasEvent = [3, 8, 15, 22, 27].includes(day)
          const isToday = day === 2
          return (
            <div
              key={day}
              className={`aspect-square p-1 rounded-lg text-sm flex flex-col transition ${
                isToday
                  ? 'bg-gradient-to-br from-astro-purple to-astro-blue text-white'
                  : hasEvent
                  ? 'bg-white/5 hover:bg-white/10 border border-astro-purple/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <span className="text-xs">{day}</span>
              {hasEvent && !isToday && (
                <span className="mt-auto w-1.5 h-1.5 rounded-full bg-astro-purple"></span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
