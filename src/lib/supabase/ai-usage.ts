import { createAuthClient } from './client'

/** Per-user free-tier quota for the server-side Gemini fallback (per calendar month). */
export const FREE_TIER_MONTHLY_QUOTA = 30

export interface AiUsage {
  yearMonth: string
  requestCount: number
  remaining: number
}

/**
 * Stable year-month key for the supplied date. Uses UTC so the boundary is
 * unambiguous regardless of the user's local timezone (the cost ceiling
 * cares about Google's billing calendar, not the user's wall clock).
 */
export function currentYearMonth(now: Date = new Date()): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Fetch the current month's request count for a user. Returns 0 when no row
 * exists yet (the user hasn't made any requests this month).
 */
export async function getCurrentUsage(
  token: string,
  userId: string,
  now: Date = new Date(),
): Promise<AiUsage> {
  const yearMonth = currentYearMonth(now)
  const client = createAuthClient(token)
  const { data, error } = await client
    .from('ai_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const requestCount = data?.request_count ?? 0
  return {
    yearMonth,
    requestCount,
    remaining: Math.max(0, FREE_TIER_MONTHLY_QUOTA - requestCount),
  }
}

/**
 * Atomically increment the caller's counter for the current UTC month and
 * return the new count. Goes through the SECURITY DEFINER `increment_ai_usage`
 * RPC (sql/005, locked down by sql/006): end users have no INSERT/UPDATE policy
 * on `ai_usage`, so they cannot lower the counter, and the RPC takes the user
 * id from the JWT `sub` and increments in a single INSERT ... ON CONFLICT.
 */
export async function incrementUsage(token: string): Promise<number> {
  const client = createAuthClient(token)
  const { data, error } = await client.rpc('increment_ai_usage')
  if (error) throw new Error(error.message)
  return data as number
}
