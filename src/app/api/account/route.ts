import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchRemote, deleteRemote } from '@/lib/supabase/sync'

/**
 * GET /api/account — Export user data (GDPR)
 */
export async function GET() {
  const { userId, getToken } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getToken({ template: 'supabase' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 })
    }

    const remote = await fetchRemote(token, userId)
    if (!remote) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    return NextResponse.json(remote.data, {
      headers: {
        'Content-Disposition': 'attachment; filename="bonnie-wee-plot-export.json"',
      },
    })
  } catch (err) {
    console.error('[/api/account] Export failed:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

/**
 * DELETE /api/account — Delete user data (GDPR)
 */
export async function DELETE() {
  const { userId, getToken } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getToken({ template: 'supabase' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 })
    }

    await deleteRemote(token, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/account] Deletion failed:', err)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
