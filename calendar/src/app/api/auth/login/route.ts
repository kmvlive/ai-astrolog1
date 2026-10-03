import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Используем отдельный эндпоинт для календаря (не трогает основной /api/login)
    const response = await fetch(`${LARAVEL_API}/calendar/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMsg = data.errors?.email?.[0] || data.message || 'Ошибка авторизации'
      return NextResponse.json({ error: errorMsg }, { status: response.status })
    }

    const res = NextResponse.json({ success: true, user: data.user })
    res.cookies.set('cal_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка подключения к серверу' },
      { status: 500 }
    )
  }
}
