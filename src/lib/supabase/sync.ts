import { createAuthClient } from './client'
import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteData {
  data: AllotmentData
  updatedAt: string
}

/**
 * Stable content fingerprint for an AllotmentData blob with `meta.updatedAt`
 * blanked out. Used by the sync layer to decide whether two snapshots are the
 * same regardless of timestamp drift — schema migrations, data repair, and
 * other load-time side effects can churn `updatedAt` without changing any
 * meaningful content, and we don't want that to trigger a cloud push.
 */
export function contentSnapshot(data: AllotmentData): string {
  return JSON.stringify({ ...data, meta: { ...data.meta, updatedAt: '' } })
}

/**
 * Heuristic: does `local` look structurally smaller than `remote` on any of
 * the user-facing axes (plantings, areas, varieties)? Used as a safety net on
 * initial sync — if LWW says "push local" but local has fewer plantings/areas/
 * varieties than remote, treat it as a conflict instead of silently
 * overwriting cloud data with what is probably a stale or freshly-initialised
 * local copy.
 */
export function isLocalStructurallySmaller(local: AllotmentData, remote: AllotmentData): boolean {
  const countPlantings = (d: AllotmentData) =>
    (d.seasons || []).reduce(
      (sum, s) => sum + (s.areas || []).reduce((a, area) => a + (area.plantings?.length || 0), 0),
      0
    )
  const localPlantings = countPlantings(local)
  const remotePlantings = countPlantings(remote)
  if (localPlantings < remotePlantings) return true

  const localAreas = local.layout?.areas?.length || 0
  const remoteAreas = remote.layout?.areas?.length || 0
  if (localAreas < remoteAreas) return true

  const localVarieties = local.varieties?.length || 0
  const remoteVarieties = remote.varieties?.length || 0
  if (localVarieties < remoteVarieties) return true

  return false
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
