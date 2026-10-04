import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

interface Cal {
  id: number
  name: string
  color: string
  is_default: boolean
  events_count: number
}

interface Ev {
  id: number
  calendar_id: number
  title: string
  start: string
  location?: string | null
  all_day: boolean
}

function fmtDate(iso: string, allDay: boolean) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })
  if (allDay) return date
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cal_token')?.value
  if (!token) redirect('/login')

  let user: any = null
  let calendars: Cal[] = []
  let upcoming: Ev[] = []

  try {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 86400000)

    const [meRes, calRes, evRes] = await Promise.all([
      fetch(`${LARAVEL_API}/calendar/me`, { headers, cache: 'no-store' }),
      fetch(`${LARAVEL_API}/calendar/calendars`, { headers, cache: 'no-store' }),
      fetch(
        `${LARAVEL_API}/calendar/events?start=${now.toISOString()}&end=${in30.toISOString()}`,
        { headers, cache: 'no-store' }
      ),
    ])

    if (meRes.ok) user = (await meRes.json()).user
    if (calRes.ok) calendars = (await calRes.json()).calendars || []
    if (evRes.ok) {
      upcoming = ((await evRes.json()).events || [])
        .filter((e: Ev) => new Date(e.start) >= new Date(now.getTime() - 86400000))
        .sort((a: Ev, b: Ev) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5)
    }
  } catch {}

  const calColor = (id: number) => calendars.find((c) => c.id === id)?.color || '#8b5cf6'
  const totalEvents = calendars.reduce((s, c) => s + c.events_count, 0)

  return (
    <main>
      <Header />
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Приветствие */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Добро пожаловать, {user?.name || 'друг'}!
            </h1>
            <p className="text-white/60">
              {user?.calendar_pro_enabled
                ? '✨ PRO-тариф: безлимит календарей и напоминаний'
                : 'Бесплатный тариф: до 3 календарей'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/calendars" className="btn-gradient px-5 py-2.5 rounded-lg font-semibold">
              📅 Мои календари
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-3xl font-bold mb-1">{calendars.length}</div>
            <div className="text-sm text-white/60">календарей</div>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-3xl font-bold mb-1">{totalEvents}</div>
            <div className="text-sm text-white/60">событий всего</div>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-3xl font-bold mb-1">{upcoming.length}</div>
            <div className="text-sm text-white/60">в ближайшие 30 дней</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Календари */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Мои календари</h2>
              <Link href="/calendars" className="text-sm text-astro-purple hover:underline">
                Все →
              </Link>
            </div>
            {calendars.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-white/60 mb-4">Пока нет календарей</p>
                <Link href="/calendars" className="btn-gradient px-5 py-2 rounded-lg text-sm inline-block">
                  Создать первый
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {calendars.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/calendars/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/15 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-medium">{c.name}</span>
                      {c.is_default && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          основной
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white/50">{c.events_count} соб.</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Ближайшие события */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Ближайшие события</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🌤</div>
                <p className="text-white/60 mb-4">В ближайшие 30 дней событий нет</p>
                {calendars[0] && (
                  <Link
                    href={`/calendars/${calendars[0].id}`}
                    className="btn-gradient px-5 py-2 rounded-lg text-sm inline-block"
                  >
                    + Добавить событие
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((e) => (
                  <Link
                    key={e.id}
                    href={`/calendars/${e.calendar_id}`}
                    className="block p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/15 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: calColor(e.calendar_id) }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{e.title}</div>
                        <div className="text-sm text-white/50">
                          {fmtDate(e.start, e.all_day)}
                          {e.location ? ` · ${e.location}` : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
