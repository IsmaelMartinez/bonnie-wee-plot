import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchAllotment, deleteAllotment } from '@/lib/neon/client'

/**
 * GET /api/account — Export user data (GDPR)
 */
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

    return NextResponse.json(result.data, {
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
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await deleteAllotment(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/account] Deletion failed:', err)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
