import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-astro-purple to-astro-blue flex items-center justify-center">
              📅
            </div>
            <span className="font-semibold">AI Календарь</span>
          </div>
          <p className="text-sm text-white/50">
            Умные календари с напоминаниями от команды AI Астролога
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Продукт</div>
          <ul className="space-y-2 text-sm text-white/60">
            <li><a href="#pricing" className="hover:text-white transition">Тарифы</a></li>
            <li><Link href="/features" className="hover:text-white transition">Возможности</Link></li>
            <li><Link href="/integrations" className="hover:text-white transition">Интеграции</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Экосистема</div>
          <ul className="space-y-2 text-sm text-white/60">
            <li><a href="https://my.neiro-astro.ru" className="hover:text-white transition">AI Астролог</a></li>
            <li><a href="https://my.neiro-astro.ru/meditations" className="hover:text-white transition">Медитации</a></li>
            <li><a href="https://my.neiro-astro.ru/blog" className="hover:text-white transition">Блог</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Контакты</div>
          <ul className="space-y-2 text-sm text-white/60">
            <li><a href="mailto:support@neiro-astro.ru" className="hover:text-white transition">support@neiro-astro.ru</a></li>
            <li><a href="https://t.me/neiro_horoskop_bot" className="hover:text-white transition">Telegram-бот</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/40">
        © 2026 AI Астролог. Все права защищены.
      </div>
    </footer>
  )
}
