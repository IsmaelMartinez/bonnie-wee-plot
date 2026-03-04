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
