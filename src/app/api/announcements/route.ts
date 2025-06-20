import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export interface Announcement {
  id: string
  type: 'delivery' | 'order' | 'tip' | 'event'
  title: string
  content: string
  author: string
  date: string
  priority: 'high' | 'medium' | 'low'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'announcements.json')

async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function readAnnouncements(): Promise<Announcement[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeAnnouncements(announcements: Announcement[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(DATA_FILE, JSON.stringify(announcements, null, 2))
}

export async function GET() {
  try {
    const announcements = await readAnnouncements()
    const activeAnnouncements = announcements
      .filter(a => a.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json(activeAnnouncements)
  } catch (error) {
    console.error('Error reading announcements:', error)
    return NextResponse.json({ error: 'Failed to read announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received')
    const contentType = request.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type:', contentType)
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }
    
    const body = await request.json()
    console.log('Request body:', body)
    const { type, title, content, author, priority } = body

    if (!type || !title || !content || !author) {
      console.error('Missing required fields:', { type, title, content, author })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate announcement type
    const validTypes = ['delivery', 'order', 'tip', 'event']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid announcement type' }, { status: 400 })
    }

    // Validate priority level
    const validPriorities = ['high', 'medium', 'low']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority level' }, { status: 400 })
    }

    const announcements = await readAnnouncements()
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      type,
      title,
      content,
      author,
      date: new Date().toISOString().split('T')[0],
      priority: priority ?? 'medium',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    announcements.push(newAnnouncement)
    await writeAnnouncements(announcements)

    return NextResponse.json(newAnnouncement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
