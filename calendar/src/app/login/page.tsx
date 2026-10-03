'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
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
        return
      }

      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <Header />
      <section className="relative z-10 max-w-md mx-auto px-6 py-16">
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

        <div className="mt-6 p-4 rounded-lg border border-white/5 bg-white/[0.01] text-xs text-white/50">
          <div className="font-semibold mb-2 text-white/70">Тестовый аккаунт:</div>
          <div>Email: <span className="text-astro-blue">test@calendar.local</span></div>
          <div>Password: <span className="text-astro-blue">password123</span></div>
          <div className="mt-2 text-astro-purple">✨ PRO включён</div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
