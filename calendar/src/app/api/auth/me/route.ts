import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cal_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(`${LARAVEL_API}/calendar/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await response.json()
    return NextResponse.json(user)
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
