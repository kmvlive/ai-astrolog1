'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Неверный email или пароль')
        setLoading(false)
        return
      }

      // Используем window.location вместо router.push
      // Это гарантирует что cookie будет установлен ДО перезагрузки страницы
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Ошибка подключения к серверу')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
      <h1 className="text-3xl font-bold mb-6 text-center">Вход в AI Календарь</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none transition"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-astro-purple focus:outline-none transition"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gradient py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-white/60">
        Нет аккаунта?{' '}
        <a href="https://my.neiro-astro.ru/register" className="text-astro-purple hover:underline">
          Зарегистрироваться
        </a>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-white/60 hover:text-white transition">
          ← На главную
        </Link>
      </div>
    </div>
  )
}
