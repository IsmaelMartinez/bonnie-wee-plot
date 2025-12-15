import { NextRequest, NextResponse } from 'next/server'
import { getDataFile, readAnnouncements } from '@/lib/announcements'

export async function GET(request: NextRequest) {
  try {
    const dataFile = getDataFile(request)
    const announcements = await readAnnouncements(dataFile)
    // Return all announcements (including inactive) sorted by creation date
    const sortedAnnouncements = [...announcements]
    sortedAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json(sortedAnnouncements)
  } catch (error) {
    console.error('Error reading announcements for admin:', error)
    return NextResponse.json({ error: 'Failed to read announcements' }, { status: 500 })
  }
}
