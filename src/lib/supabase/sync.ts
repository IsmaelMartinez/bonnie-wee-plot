import { createAuthClient } from './client'
import type { AllotmentData } from '@/types/unified-allotment'

/**
 * JSON read/delete helpers for the `allotments` JSONB mirror.
 *
 * ADR 027 Step 4 moved the cloud *transport* to Yjs binary (see
 * `sync-binary.ts`), which now owns the read-merge-write path. The `data`
 * JSONB column is kept as a derived mirror, and these functions still serve
 * the GDPR export (`GET /api/account`, which needs JSON back) and the
 * server-side history table. The old JSONB last-write-wins push
 * (`pushToRemote`) and its content/size guards were retired with the LWW
 * machinery.
 */

export interface RemoteData {
  data: AllotmentData
  updatedAt: string
}

/**
 * Fetch the user's allotment JSONB from Supabase.
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
   * Lightweight summary computed from a partial-JSON projection of the
   * snapshot — only `data->layout->areas` and `data->varieties` are pulled
   * so the list query stays cheap even when individual snapshots are large.
   * The plantings count would require walking `seasons[].areas[].plantings`
   * which is the bulk of the JSONB blob, so it's intentionally omitted from
   * the summary; users can still restore and inspect the full snapshot.
   */
  summary?: {
    areas: number
    varieties: number
  }
}

interface HistoryListRow {
  id: number
  archived_at: string
  // PostgREST returns the last path segment as the key when you select with
  // `data->layout->areas` / `data->varieties` — both arrive as JSON arrays.
  areas: unknown[] | null
  varieties: unknown[] | null
}

/**
 * List the most recent N history snapshots for the given user. Returns
 * lightweight metadata (id + archivedAt + small summary). The full
 * snapshot is fetched on demand via fetchHistorySnapshot when the user
 * picks one to restore — that keeps this list query bounded in size even
 * for accounts with several hundred KB of allotment data.
 */
export async function fetchHistoryList(
  token: string,
  userId: string,
  limit = 20
): Promise<HistoryEntry[]> {
  const client = createAuthClient(token)
  const { data, error } = await client
    .from('allotment_history')
    .select('id, archived_at, areas:data->layout->areas, varieties:data->varieties')
    .eq('user_id', userId)
    .order('archived_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  if (!Array.isArray(data)) return []

  return (data as unknown as HistoryListRow[]).map((row) => ({
    id: row.id,
    archivedAt: row.archived_at,
    summary: {
      areas: Array.isArray(row.areas) ? row.areas.length : 0,
      varieties: Array.isArray(row.varieties) ? row.varieties.length : 0,
    },
  }))
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
