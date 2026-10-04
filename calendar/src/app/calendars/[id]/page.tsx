import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main>
      <Header />
      <section className="relative z-10 px-6 py-6">
        <CalendarView calendarId={parseInt(id)} />
      </section>
      <Footer />
    </main>
  )
}
