import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchAllotment, upsertAllotment, deleteAllotment } from '@/lib/neon/client'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await fetchAllotment(userId)
    if (!result) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }
    return NextResponse.json({ data: result.data, updatedAt: result.updatedAt })
  } catch (err) {
    console.error('[/api/sync] Fetch failed:', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data } = await request.json()
    await upsertAllotment(userId, data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/sync] Upsert failed:', err)
    return NextResponse.json({ error: 'Upsert failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await deleteAllotment(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/sync] Delete failed:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
