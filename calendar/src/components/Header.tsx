import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function Header() {
  return (
    <header className="relative z-10 border-b border-white/5 backdrop-blur-sm bg-astro-darker/50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-astro-purple to-astro-blue flex items-center justify-center text-xl shadow-lg shadow-astro-purple/30 group-hover:shadow-astro-purple/60 transition-all">
            📅
          </div>
          <div>
            <div className="text-lg font-semibold">AI Календарь</div>
            <div className="text-xs text-white/40 -mt-0.5">от AI Астролога</div>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-white/80 hover:text-white transition">
            Тарифы
          </Link>
          <a href="https://my.neiro-astro.ru" className="text-sm text-white/60 hover:text-white transition">
            ← Астролог
          </a>
          <Link href="/login" className="text-sm text-white/80 hover:text-white transition">
            Войти
          </Link>
          <Link href="/dashboard" className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium text-white">
            Мой кабинет
          </Link>
          <LogoutButton />
        </div>
      </nav>
    </header>
  )
}
