import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Календарь — умные напоминания',
  description: 'Создавай календари с напоминаниями по email, Telegram и VK Max. Интеграция с AI Астрологом.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="starfield min-h-screen">{children}</body>
    </html>
  )
}
