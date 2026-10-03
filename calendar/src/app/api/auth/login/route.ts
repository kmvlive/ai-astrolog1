import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${LARAVEL_API}/login`, {
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
      return NextResponse.json(
        { error: data.message || 'Ошибка авторизации' },
        { status: response.status }
      )
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set('cal_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
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
