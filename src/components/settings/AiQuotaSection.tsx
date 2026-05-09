'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { FREE_TIER_MONTHLY_QUOTA, getCurrentUsage, type AiUsage } from '@/lib/supabase/ai-usage'

interface AiQuotaSectionProps {
  /** Whether the user has a BYO OpenAI token configured. When true, the
   * free-tier quota is irrelevant — they bypass it. */
  hasOwnToken: boolean
}

/**
 * Surfaces the user's free-tier monthly Aitor quota when the server-side
 * Gemini fallback is in play. Stays silent when the user has their own
 * OpenAI token (no quota applies) or when Supabase isn't configured.
 */
export default function AiQuotaSection({ hasOwnToken }: AiQuotaSectionProps) {
  const { isSignedIn, userId, getToken } = useOptionalAuth()
  const [usage, setUsage] = useState<AiUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn || !userId || !isSupabaseConfigured() || hasOwnToken) {
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
    return () => { cancelled = true }
  }, [isSignedIn, userId, hasOwnToken, getToken])

  if (!isSignedIn || hasOwnToken) return null
  if (isLoading) return null
  if (error) {
    return (
      <p className="text-xs text-zen-stone-500">{error}</p>
    )
  }
  if (!usage) return null

  const used = usage.requestCount
  const remaining = usage.remaining
  const exhausted = remaining <= 0

  return (
    <div
      className={`rounded-zen border p-3 flex items-start gap-2 ${
        exhausted
          ? 'bg-zen-kitsune-50 border-zen-kitsune-200'
          : 'bg-zen-moss-50 border-zen-moss-100'
      }`}
      role="status"
      aria-label="Free Aitor quota"
    >
      <Sparkles
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
          exhausted ? 'text-zen-kitsune-600' : 'text-zen-moss-600'
        }`}
        aria-hidden="true"
      />
      <div className="text-sm text-zen-ink-700">
        <p className="font-medium">
          {used} / {FREE_TIER_MONTHLY_QUOTA} free Aitor requests used this month
        </p>
        <p className="text-xs text-zen-stone-600 mt-1">
          {exhausted
            ? 'Free quota exhausted. Add your own OpenAI key below for unlimited use, or check back next month.'
            : 'Add your own OpenAI key below for unlimited use.'}
        </p>
      </div>
    </div>
  )
}
