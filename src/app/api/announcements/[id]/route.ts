import { NextRequest, NextResponse } from 'next/server'
import {
  getDataFile,
  readAnnouncements,
  writeAnnouncements
} from '@/lib/announcements'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const dataFile = getDataFile(request)
    const body = await request.json()
    const announcements = await readAnnouncements(dataFile)
    const index = announcements.findIndex(a => a.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    announcements[index] = {
      ...announcements[index],
      ...body,
      updatedAt: new Date().toISOString()
    }

    await writeAnnouncements(dataFile, announcements)
    return NextResponse.json(announcements[index])
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const dataFile = getDataFile(request)
    const announcements = await readAnnouncements(dataFile)
    const index = announcements.findIndex(a => a.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    announcements[index].isActive = false
    announcements[index].updatedAt = new Date().toISOString()

    await writeAnnouncements(dataFile, announcements)
    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
