import Link from 'next/link'
import { cookies } from 'next/headers'

export default async function Header() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cal_token')?.value
  const isLoggedIn = !!token

  let userName = ''
  if (isLoggedIn) {
    try {
      const res = await fetch('http://172.17.0.1:8002/api/calendar/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        userName = data.user?.name || ''
      }
    } catch {}
  }

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
          {isLoggedIn && (
            <>
              <Link href="/calendars" className="text-sm text-white/80 hover:text-white transition">
                Мои календари
              </Link>
              <Link href="/pricing" className="text-sm text-white/80 hover:text-white transition">
                Тарифы
              </Link>
            </>
          )}
          
          <Link href="https://my.neiro-astro.ru" className="text-sm text-white/60 hover:text-white transition">
            ← Астролог
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium text-white">
                {userName || 'Мой кабинет'}
              </Link>
              <form action="/api/auth/logout" method="POST" className="inline">
                <button type="submit" className="text-sm text-white/60 hover:text-white transition">
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/80 hover:text-white transition">
                Войти
              </Link>
              <Link href="/dashboard" className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium text-white">
                Мой кабинет
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
