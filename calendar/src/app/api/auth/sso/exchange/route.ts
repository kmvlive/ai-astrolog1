import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${LARAVEL_API}/calendar/sso/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ code: body.code }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json(data, { status: response.status })
    }

    // Устанавливаем cookie с токеном
    const res = NextResponse.json(data)
    res.cookies.set('cal_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    return res
  } catch (error) {
    console.error('SSO exchange error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка подключения к серверу' },
      { status: 500 }
    )
  }
}
