import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CalendarsList from '@/components/CalendarsList'

export default function CalendarsPage() {
  return (
    <main>
      <Header />
      <section className="relative z-10 px-6 py-12">
        <CalendarsList />
      </section>
      <Footer />
    </main>
  )
}
