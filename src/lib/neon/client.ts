import { neon } from '@neondatabase/serverless'
import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteAllotment {
  data: AllotmentData
  updatedAt: string
}

function getSQL() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not configured')
  return neon(url)
}

export async function fetchAllotment(userId: string): Promise<RemoteAllotment | null> {
  const sql = getSQL()
  const rows = await sql`SELECT data, updated_at FROM allotments WHERE user_id = ${userId}`
  if (rows.length === 0) return null
  return {
    data: rows[0].data as AllotmentData,
    updatedAt: rows[0].updated_at as string,
  }
}

export async function upsertAllotment(userId: string, data: AllotmentData): Promise<void> {
  const sql = getSQL()
  const json = JSON.stringify(data)
  await sql`
    INSERT INTO allotments (user_id, data, updated_at)
    VALUES (${userId}, ${json}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = ${json}::jsonb, updated_at = now()
  `
}

export async function deleteAllotment(userId: string): Promise<void> {
  const sql = getSQL()
  await sql`DELETE FROM allotments WHERE user_id = ${userId}`
}
