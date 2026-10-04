'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCalendars, createCalendar, deleteCalendar, Calendar } from '@/lib/calendarApi'

const COLORS = [
  { name: 'Фиолетовый', value: '#8b5cf6' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Зелёный', value: '#10b981' },
  { name: 'Оранжевый', value: '#f59e0b' },
  { name: 'Розовый', value: '#ec4899' },
]

export default function CalendarsList() {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [limits, setLimits] = useState({ pro: false, max_free: 3 })
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0].value)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const loadCalendars = async () => {
    try {
      const data = await getCalendars()
      setCalendars(data.calendars)
      setLimits(data.limits)
    } catch (e: any) {
      setError('Не удалось загрузить календари')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCalendars() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createCalendar({ name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor(COLORS[0].value)
      setShowCreate(false)
      await loadCalendars()
    } catch (e: any) {
      if (e.message?.includes('LIMIT')) {
        setError('На бесплатном тарифе доступно до 3 календарей. Включите PRO!')
      } else {
        setError(e.message || 'Ошибка создания')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить календарь "${name}" и все его события?`)) return
    try {
      await deleteCalendar(id)
      await loadCalendars()
    } catch (e: any) {
      setError('Не удалось удалить')
    }
  }

  const canCreateMore = limits.pro || calendars.length < limits.max_free

  if (loading) {
    return (
      <div className="text-center py-12 text-white/60">
        <div className="text-4xl mb-4">⏳</div>
        Загрузка календарей...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">📅 Мои календари</h1>
          <p className="text-white/60">
            {limits.pro ? (
              <span>✨ PRO: безлимит календарей ({calendars.length} создано)</span>
            ) : (
              <span>Использовано {calendars.length} из {limits.max_free} бесплатных календарей</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!canCreateMore}
          className="btn-gradient px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Новый календарь
        </button>
      </div>

      {/* Апгрейд-баннер для free */}
      {!canCreateMore && (
        <div className="mb-6 p-4 rounded-xl border border-astro-purple/30 bg-gradient-to-r from-astro-purple/10 to-astro-blue/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold mb-1">🚀 Лимит достигнут</div>
              <div className="text-sm text-white/70">Включите PRO для безлимитных календарей</div>
            </div>
            <Link href="/pricing" className="btn-gradient px-4 py-2 rounded-lg text-sm">
              Обновить до PRO
            </Link>
          </div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Сетка календарей */}
      {calendars.length === 0 ? (
        <div className="text-center py-16 border border-white/10 rounded-2xl bg-white/[0.02]">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold mb-2">Пока нет календарей</h2>
          <p className="text-white/60 mb-6">Создайте первый календарь и начните планировать!</p>
          <button onClick={() => setShowCreate(true)} className="btn-gradient px-6 py-3 rounded-lg font-semibold">
            Создать календарь
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendars.map((cal) => (
            <div
              key={cal.id}
              className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all"
            >
              {/* Цветная полоса слева */}
              <div
                className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                style={{ backgroundColor: cal.color }}
              />

              <div className="pl-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{cal.name}</h3>
                    {cal.is_default && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        По умолчанию
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(cal.id, cal.name)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition"
                    title="Удалить"
                  >
                    🗑
                  </button>
                </div>

                <div className="text-sm text-white/60 mb-4">
                  📊 {cal.events_count} {cal.events_count === 1 ? 'событие' : 'событий'}
                </div>

                <Link
                  href={`/calendars/${cal.id}`}
                  className="block w-full text-center py-2.5 rounded-lg border border-white/10 hover:bg-white/5 hover:border-astro-purple transition font-medium"
                >
                  Открыть календарь →
                </Link>
              </div>
            </div>
          ))}

          {/* Карточка "+ Новый" */}
          {canCreateMore && (
            <button
              onClick={() => setShowCreate(true)}
              className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-astro-purple/50 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="text-5xl mb-3 opacity-50">+</div>
              <div className="text-white/60 font-medium">Новый календарь</div>
            </button>
          )}
        </div>
      )}

      {/* Модалка создания */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-astro-darker" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Новый календарь</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Название</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Например: Работа, Семья, Учёба"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewColor(c.value)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        newColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-astro-darker scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 btn-gradient py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
