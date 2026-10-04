import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const LARAVEL_API = 'http://172.17.0.1:8002/api'

async function authHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cal_token')?.value
  if (!token) throw new Error('No token')
  return { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`${LARAVEL_API}/calendar/calendars/${id}`, {
      method: 'PUT',
      headers: { ...await authHeaders(), 'Content-Type': 'application/json' },
      body: await req.text(),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`${LARAVEL_API}/calendar/calendars/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
