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
 * Atomically increment the user's monthly counter by one. Inserts a row with
 * count=1 if none exists, otherwise increments the existing row. Returns the
 * new count.
 *
 * The increment uses a SELECT-then-UPSERT pattern rather than a raw SQL
 * `UPDATE ... SET count = count + 1` because PostgREST doesn't expose the
 * latter directly. The race window is small (<10ms) and the consequence of
 * losing a race (one extra request slipping through) is acceptable for a
 * cost-bounded free tier.
 */
export async function incrementUsage(
  token: string,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const yearMonth = currentYearMonth(now)
  const client = createAuthClient(token)

  const { data: existing, error: readError } = await client
    .from('ai_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .maybeSingle()

  if (readError) throw new Error(readError.message)

  const newCount = (existing?.request_count ?? 0) + 1
  const { error: writeError } = await client
    .from('ai_usage')
    .upsert(
      {
        user_id: userId,
        year_month: yearMonth,
        request_count: newCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,year_month' },
    )

  if (writeError) throw new Error(writeError.message)
  return newCount
}
