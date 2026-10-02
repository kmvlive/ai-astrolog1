export default function Features() {
  const features = [
    {
      icon: '📅',
      title: 'Красивые календари',
      desc: 'Создавай неограниченное количество календарей с разными цветами и категориями',
      color: 'from-astro-purple to-purple-400',
    },
    {
      icon: '⏰',
      title: 'Умные напоминания',
      desc: 'За 15 минут, за час, за день — выбирай когда и как напомнить о событии',
      color: 'from-astro-blue to-cyan-400',
    },
    {
      icon: '📱',
      title: '3 канала уведомлений',
      desc: 'Email через UniSender, Telegram-бот, или VK Max — выбирай удобный',
      color: 'from-astro-orange to-amber-400',
    },
    {
      icon: '🔒',
      title: 'Приватные и публичные',
      desc: 'Держи личный календарь закрытым или делись ссылкой с друзьями и семьёй',
      color: 'from-emerald-400 to-teal-400',
    },
    {
      icon: '✨',
      title: 'AI-интеграция',
      desc: 'Подключи AI Астролога — получай лунные дни, гороскопы и аффирмации прямо в календарь',
      color: 'from-pink-400 to-rose-400',
    },
    {
      icon: '📤',
      title: 'Импорт из Google',
      desc: 'Перенеси существующие события из Google Calendar или Apple Calendar одним кликом',
      color: 'from-indigo-400 to-purple-400',
    },
  ]

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Всё что нужно для идеального планирования
        </h2>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">
          Простой и мощный инструмент, который работает так как ты ожидаешь
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {f.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
