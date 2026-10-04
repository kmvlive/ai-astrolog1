'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SSOContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) {
      setError('Код не найден в URL')
      setLoading(false)
      return
    }

    // Обмениваем код на данные пользователя
    const exchangeCode = async () => {
      try {
        const res = await fetch('/api/auth/sso/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          setError(data.error || 'Ошибка авторизации')
          setLoading(false)
          return
        }

        // Успех! Редирект на dashboard
        window.location.href = '/dashboard'
      } catch (err) {
        setError('Ошибка подключения к серверу')
        setLoading(false)
      }
    }

    exchangeCode()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Авторизация...</h1>
          <p className="text-white/60">Входим в AI Календарь</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
          <div className="text-4xl mb-4 text-center">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-center">Ошибка авторизации</h1>
          <p className="text-white/70 mb-6 text-center">{error}</p>
          <div className="space-y-3">
            <a
              href="/login"
              className="block text-center btn-gradient py-3 rounded-lg font-semibold text-white"
            >
              Войти вручную
            </a>
            <a
              href="https://my.neiro-astro.ru"
              className="block text-center py-3 rounded-lg font-semibold text-white border border-white/20 hover:bg-white/5 transition"
            >
              Вернуться на основной сайт
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function SSOPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Загрузка...</h1>
        </div>
      </div>
    }>
      <SSOContent />
    </Suspense>
  )
}
