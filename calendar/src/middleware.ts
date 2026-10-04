import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // 🔒 Принудительный HTTPS.
  // ВАЖНО: за nginx Next.js получает запросы по http, поэтому смотрим
  // на заголовок x-forwarded-proto от nginx, а не на url.protocol —
  // иначе возникнет бесконечный редирект.
  const proto = request.headers.get('x-forwarded-proto')
  if (proto === 'http' && !url.hostname.startsWith('localhost') && !url.hostname.startsWith('127.0.0.1')) {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 308)
  }

  const token = request.cookies.get('cal_token')?.value

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
