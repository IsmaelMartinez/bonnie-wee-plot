'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getCurrentUsage, type AiUsage } from '@/lib/supabase/ai-usage'

export interface AiQuotaState {
  /** Current month's usage, or null while loading / on error / when the lookup doesn't apply. */
  usage: AiUsage | null
  error: string | null
  isLoading: boolean
  /** Re-fetch the counter (e.g. after a request that spent quota). */
  refresh: () => void
}

/**
 * Client-side lookup of the shared free-tier AI quota (`ai_usage` counter,
 * spent by both Aitor and season narration). Requires a signed-in user and
 * configured Supabase; otherwise resolves to no usage without fetching.
 * Pass `enabled: false` to skip the lookup entirely (e.g. BYO key users,
 * or a provider selection the quota doesn't apply to).
 */
export function useAiQuota(enabled: boolean = true): AiQuotaState {
  const { isSignedIn, userId, getToken } = useOptionalAuth()
  const [usage, setUsage] = useState<AiUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchCount, setFetchCount] = useState(0)

  useEffect(() => {
    if (!enabled || !isSignedIn || !userId || !isSupabaseConfigured()) {
      setUsage(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      try {
        const token = await getToken({ template: 'supabase' })
        if (!token) {
          if (!cancelled) {
            setError('Could not check quota — JWT template not configured.')
            setIsLoading(false)
          }
          return
        }
        const u = await getCurrentUsage(token, userId!)
        if (!cancelled) {
          setUsage(u)
          setError(null)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load quota')
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [enabled, isSignedIn, userId, getToken, fetchCount])

  const refresh = useCallback(() => setFetchCount((c) => c + 1), [])

  return { usage, error, isLoading, refresh }
}
