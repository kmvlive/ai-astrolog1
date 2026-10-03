import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <main>
      <Header />
      <section className="relative z-10 max-w-md mx-auto px-6 py-16">
        <Suspense fallback={
          <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-center text-white/60">Загрузка...</div>
          </div>
        }>
          <LoginForm />
        </Suspense>

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
