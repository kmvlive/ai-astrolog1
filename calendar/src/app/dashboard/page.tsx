import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import UserBadge from '@/components/UserBadge'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cal_token')?.value
  
  if (!token) return null

  try {
    const res = await fetch(`${LARAVEL_API}/calendar/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  return (
    <main>
      <Header />
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Добро пожаловать, {user.name}!</h1>
          <p className="text-white/60">Ваш личный кабинет AI Календаря</p>
        </div>

        <UserBadge user={user} />

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-3xl mb-3">📅</div>
            <h2 className="text-xl font-semibold mb-2"><a href="/calendars" className="hover:text-astro-purple transition">Мои календари →</a></h2>
            <p className="text-white/60 text-sm mb-4">
              {user.calendar_pro_enabled 
                ? 'У вас тариф PRO — создавайте неограниченное количество календарей' 
                : 'Вы можете создать до 3 календарей бесплатно'}
            </p>
            <button className="btn-gradient px-6 py-2 rounded-lg text-sm font-semibold text-white">
              Создать календарь
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-xl font-semibold mb-2">Настройки</h2>
            <p className="text-white/60 text-sm mb-4">
              Управление уведомлениями, интеграциями и профилем
            </p>
            <button className="px-6 py-2 rounded-lg text-sm font-semibold text-white border border-white/20 hover:bg-white/5 transition">
              Открыть настройки
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-2xl border border-astro-purple/20 bg-gradient-to-br from-astro-purple/5 to-astro-blue/5">
          <h2 className="text-2xl font-bold mb-4">🚧 Раздел в разработке</h2>
          <p className="text-white/70 mb-4">
            Полноценный UI календаря будет доступен в следующей версии. 
            Сейчас вы видите демо-версию защищённой области.
          </p>
          <div className="text-sm text-white/50">
            <div>ID пользователя: {user.id}</div>
            <div>Email: {user.email}</div>
            <div>Статус: {user.calendar_pro_enabled ? '✨ PRO' : 'Free'}</div>
            <div>Дата регистрации: {new Date(user.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
