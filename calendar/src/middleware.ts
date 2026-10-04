import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // 🔒 Принудительный HTTPS — если пришёл HTTP, редиректим на HTTPS
  // Это критично для SSO flow: редирект с основного сайта мог придти по http
  if (url.protocol === 'http:' && !url.hostname.startsWith('localhost') && !url.hostname.startsWith('127.0.0.1')) {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 308) // 308 сохраняет POST body если был
  }

  const token = request.cookies.get('cal_token')?.value

  // Защищённые роуты
  const protectedPaths = ['/dashboard', '/calendar']
  const isProtectedPath = protectedPaths.some(path =>
    url.pathname.startsWith(path)
  )

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', url)
    loginUrl.searchParams.set('redirect', url.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
