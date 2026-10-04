'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, dateFnsLocalizer, Event as RBCEvent } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import {
  getCalendars,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  Calendar as CalendarType,
  Event as EventType,
} from '@/lib/calendarApi'

// Локализация на русский
const locales = { ru }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

interface CalendarEvent extends Omit<RBCEvent, 'title' | 'start' | 'end'> {
  id: number
  calendar_id: number
  title: string
  start: Date
  end: Date
  description?: string | null
  location?: string | null
  allDay?: boolean
  color?: string
}

// Оборачиваем Calendar в DnD HOC
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

interface ModalState {
  open: boolean
  mode: 'create' | 'edit'
  event?: CalendarEvent
  defaultStart?: Date
  defaultEnd?: Date
}

export default function CalendarView({ calendarId }: { calendarId: number }) {
  const [calendar, setCalendar] = useState<CalendarType | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' })

  // Форма
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [saving, setSaving] = useState(false)

  // Загрузка календаря + событий
  const loadData = async (date: Date) => {
    try {
      setLoading(true)
      const [calRes, evRes] = await Promise.all([
        getCalendars(),
        getEvents({
          calendar_id: calendarId,
          start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
        }),
      ])
      const cal = calRes.calendars.find((c) => c.id === calendarId)
      if (!cal) {
        setError('Календарь не найден')
        setLoading(false)
        return
      }
      setCalendar(cal)
      setEvents(
        evRes.events.map((e) => ({
          id: e.id,
          calendar_id: e.calendar_id,
          title: e.title,
          description: e.description,
          location: e.location,
          color: e.color || cal.color,
          allDay: e.all_day,
          start: new Date(e.start),
          end: e.end ? new Date(e.end) : new Date(new Date(e.start).getTime() + 3600000),
        }))
      )
      setError('')
    } catch (e: any) {
      setError('Ошибка загрузки: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(currentDate)
  }, [calendarId, currentDate])

  // Клик на слот — создание события
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    resetForm()
    setFormStart(formatDateTimeLocal(start))
    setFormEnd(formatDateTimeLocal(end))
    setModal({ open: true, mode: 'create', defaultStart: start, defaultEnd: end })
  }

  // Клик на событие — редактирование
  const handleSelectEvent = (event: CalendarEvent) => {
    setFormTitle(event.title)
    setFormDescription(event.description || '')
    setFormLocation(event.location || '')
    setFormAllDay(event.allDay || false)
    if (event.allDay) {
      setFormStart(format(event.start, 'yyyy-MM-dd'))
      setFormEnd(event.end ? format(event.end, 'yyyy-MM-dd') : '')
    } else {
      setFormStart(formatDateTimeLocal(event.start))
      setFormEnd(formatDateTimeLocal(event.end))
    }
    setModal({ open: true, mode: 'edit', event })
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormLocation('')
    setFormAllDay(false)
  }

  const formatDateTimeLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")

  // Сохранение (создание или обновление)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        const start = new Date(formStart)
        const end = formAllDay ? null : new Date(formEnd || formStart)
        await createEvent({
          calendar_id: calendarId,
          title: formTitle,
          start: start.toISOString(),
          end: end?.toISOString(),
          description: formDescription || undefined,
          location: formLocation || undefined,
          all_day: formAllDay,
        })
      } else if (modal.event) {
        const start = new Date(formStart)
        const end = formAllDay ? null : new Date(formEnd || formStart)
        await updateEvent(modal.event.id, {
          title: formTitle,
          start: start.toISOString(),
          end: end?.toISOString(),
          description: formDescription || undefined,
          location: formLocation || undefined,
          all_day: formAllDay,
        })
      }
      setModal({ open: false, mode: 'create' })
      await loadData(currentDate)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Удаление
  const handleDelete = async () => {
    if (!modal.event) return
    if (!confirm('Удалить событие?')) return
    try {
      await deleteEvent(modal.event.id)
      setModal({ open: false, mode: 'create' })
      await loadData(currentDate)
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Drag-and-drop (перенос события)
  const handleEventDrop = async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    try {
      await updateEvent(event.id, {
        start: start.toISOString(),
        end: event.allDay ? null : end.toISOString(),
      })
      await loadData(currentDate)
    } catch (e: any) {
      setError('Не удалось перенести событие')
    }
  }

  // Стили событий (цвет из календаря)
  const eventPropGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || calendar?.color || '#8b5cf6',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      fontWeight: 500,
    },
  })

  // Кастомные сообщения
  const messages = useMemo(
    () => ({
      today: 'Сегодня',
      previous: '‹',
      next: '›',
      month: 'Месяц',
      week: 'Неделя',
      day: 'День',
      agenda: 'Агенда',
      date: 'Дата',
      time: 'Время',
      event: 'Событие',
      noEventsInRange: 'Нет событий в этом диапазоне',
      showMore: (total: number) => `+ ещё ${total}`,
    }),
    []
  )

  if (loading && !calendar) {
    return (
      <div className="text-center py-12 text-white/60">
        <div className="text-4xl mb-4">⏳</div>
        Загрузка календаря...
      </div>
    )
  }

  if (error && !calendar) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-semibold mb-4">{error}</h2>
        <Link href="/calendars" className="btn-gradient px-6 py-3 rounded-lg inline-block">
          ← К списку календарей
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/calendars" className="text-sm text-white/60 hover:text-white mb-2 inline-block">
            ← Все календари
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: calendar?.color || '#8b5cf6' }}
            />
            <h1 className="text-3xl font-bold">{calendar?.name}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            const now = new Date()
            setFormStart(formatDateTimeLocal(now))
            const in1h = new Date(now.getTime() + 3600000)
            setFormEnd(formatDateTimeLocal(in1h))
            setModal({ open: true, mode: 'create' })
          }}
          className="btn-gradient px-5 py-2.5 rounded-lg font-semibold"
        >
          + Новое событие
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Календарь */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 calendar-dark">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          allDayAccessor="allDay"
          style={{ height: 700 }}
          views={['month', 'week', 'day']}
          defaultView="month"
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          eventPropGetter={eventPropGetter}
          messages={messages}
          selectable
          popup
          culture="ru"
          components={{
            toolbar: CustomToolbar,
          }}
        />
      </div>

      {/* Модалка создания/редактирования */}
      {modal.open && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModal({ open: false, mode: 'create' })}
        >
          <div
            className="max-w-md w-full p-6 rounded-2xl border border-white/10 bg-astro-darker"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">
              {modal.mode === 'create' ? 'Новое событие' : 'Редактировать событие'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Название</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  autoFocus
                  placeholder="Например: Встреча с врачом"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formAllDay}
                  onChange={(e) => setFormAllDay(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="allDay" className="text-sm text-white/70">
                  Весь день
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    {formAllDay ? 'Дата начала' : 'Начало'}
                  </label>
                  <input
                    type={formAllDay ? 'date' : 'datetime-local'}
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    {formAllDay ? 'Дата окончания' : 'Конец'}
                  </label>
                  <input
                    type={formAllDay ? 'date' : 'datetime-local'}
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Место</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Необязательно"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Описание</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Необязательно"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {modal.mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                  >
                    🗑 Удалить
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: 'create' })}
                  className="flex-1 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving || !formTitle.trim()}
                  className="flex-1 btn-gradient py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : modal.mode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .calendar-dark .rbc-toolbar {
          margin-bottom: 16px;
          color: white;
        }
        .calendar-dark .rbc-toolbar button {
          color: white;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 6px 12px;
        }
        .calendar-dark .rbc-toolbar button:hover {
          background: rgba(255,255,255,0.1);
        }
        .calendar-dark .rbc-toolbar button.rbc-active {
          background: linear-gradient(to right, #8b5cf6, #3b82f6);
          border-color: transparent;
        }
        .calendar-dark .rbc-header {
          padding: 12px;
          background: rgba(255,255,255,0.03);
          color: white;
          font-weight: 600;
          border-color: rgba(255,255,255,0.1);
        }
        .calendar-dark .rbc-month-view,
        .calendar-dark .rbc-time-view,
        .calendar-dark .rbc-agenda-view {
          background: transparent;
          border-color: rgba(255,255,255,0.1);
          color: white;
        }
        .calendar-dark .rbc-day-bg,
        .calendar-dark .rbc-off-range-bg {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.05);
        }
        .calendar-dark .rbc-today {
          background: rgba(139, 92, 246, 0.1) !important;
        }
        .calendar-dark .rbc-date-cell {
          padding: 8px;
          color: white;
        }
        .calendar-dark .rbc-off-range {
          color: rgba(255,255,255,0.3);
        }
        .calendar-dark .rbc-show-more {
          color: #8b5cf6;
          font-weight: 600;
        }
        .calendar-dark .rbc-event {
          border: none;
        }
        .calendar-dark .rbc-time-content > * {
          border-color: rgba(255,255,255,0.05);
        }
        .calendar-dark .rbc-timeslot-group {
          border-color: rgba(255,255,255,0.05);
        }
        .calendar-dark .rbc-time-header-content {
          border-color: rgba(255,255,255,0.1);
        }
        .calendar-dark .rbc-current-time-indicator {
          background-color: #ef4444;
        }
        .calendar-dark .rbc-overlay {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
        }
        /* DnD стили */
        .rbc-addons-dnd .rbc-event {
          cursor: grab;
        }
        .rbc-addons-dnd .rbc-event:active {
          cursor: grabbing;
        }
        .rbc-addons-dnd-drag-preview {
          opacity: 0.7;
        }
      `}</style>
    </div>
  )
}

// Кастомная тул-бар для лучшего вида
function CustomToolbar({ label, onNavigate, onView, view }: any) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate('TODAY')} className="px-3 py-1.5 text-sm">
          Сегодня
        </button>
        <button onClick={() => onNavigate('PREV')} className="px-2 py-1">
          ‹
        </button>
        <button onClick={() => onNavigate('NEXT')} className="px-2 py-1">
          ›
        </button>
        <span className="text-lg font-semibold ml-3">{label}</span>
      </div>
      <div className="flex gap-1">
        {['month', 'week', 'day'].map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-3 py-1.5 text-sm ${view === v ? 'rbc-active' : ''}`}
          >
            {v === 'month' ? 'Месяц' : v === 'week' ? 'Неделя' : 'День'}
          </button>
        ))}
      </div>
    </div>
  )
}
