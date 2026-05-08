import { createAuthClient } from './client'
import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteData {
  data: AllotmentData
  updatedAt: string
}

/**
 * Fetch the user's allotment from Supabase.
 * Returns null if no row exists (first-time user).
 */
export async function fetchRemote(
  token: string,
  userId: string
): Promise<RemoteData | null> {
  const client = createAuthClient(token)
  const { data, error } = await client
    .from('allotments')
    .select('data, updated_at')
    .eq('user_id', userId)
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — user has no cloud data yet
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return {
    data: data.data as AllotmentData,
    updatedAt: data.updated_at,
  }
}

/**
 * Upsert the user's allotment to Supabase.
 * Uses ON CONFLICT on user_id to update if exists, insert if not.
 */
export async function pushToRemote(
  token: string,
  userId: string,
  allotmentData: AllotmentData
): Promise<void> {
  const client = createAuthClient(token)
  const { error } = await client
    .from('allotments')
    .upsert(
      {
        user_id: userId,
        data: allotmentData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
}

/**
 * Delete the user's allotment from Supabase (GDPR deletion).
 */
export async function deleteRemote(
  token: string,
  userId: string
): Promise<void> {
  const client = createAuthClient(token)
  const { error } = await client
    .from('allotments')
    .delete()
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export interface HistoryEntry {
  id: number
  archivedAt: string
  /**
   * Lightweight summary computed client-side from the snapshot. The full
   * snapshot is only fetched on demand via fetchHistorySnapshot.
   */
  summary?: {
    plantings: number
    areas: number
    varieties: number
  }
}

/**
 * List the most recent N history snapshots for the given user. Returns
 * lightweight metadata (id + archivedAt) — fetch the full snapshot via
 * fetchHistorySnapshot when the user picks one to restore.
 */
export async function fetchHistoryList(
  token: string,
  userId: string,
  limit = 20
): Promise<HistoryEntry[]> {
  const client = createAuthClient(token)
  const { data, error } = await client
    .from('allotment_history')
    .select('id, archived_at, data')
    .eq('user_id', userId)
    .order('archived_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  if (!Array.isArray(data)) return []

  return data.map((row) => {
    const snapshot = row.data as AllotmentData
    const plantings = (snapshot.seasons || []).reduce(
      (sum, s) => sum + (s.areas || []).reduce((a, area) => a + (area.plantings?.length || 0), 0),
      0
    )
    return {
      id: row.id as number,
      archivedAt: row.archived_at as string,
      summary: {
        plantings,
        areas: snapshot.layout?.areas?.length || 0,
        varieties: snapshot.varieties?.length || 0,
      },
    }
  })
}

/**
 * Fetch a single history snapshot by id. Used when the user picks one
 * to preview or restore.
 */
export async function fetchHistorySnapshot(
  token: string,
  userId: string,
  id: number
): Promise<AllotmentData | null> {
  const client = createAuthClient(token)
  const { data, error } = await client
    .from('allotment_history')
    .select('data')
    .eq('user_id', userId)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data?.data as AllotmentData
}
