import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

async function authHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cal_token')?.value
  if (!token) throw new Error('No token')
  return { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.search
    const res = await fetch(`${LARAVEL_API}/calendar/events${query}`, { headers: await authHeaders() })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const res = await fetch(`${LARAVEL_API}/calendar/events`, {
      method: 'POST',
      headers: { ...await authHeaders(), 'Content-Type': 'application/json' },
      body: await req.text(),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
