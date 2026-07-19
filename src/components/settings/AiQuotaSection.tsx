'use client'

import { Sparkles } from 'lucide-react'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'
import { useAiQuota } from '@/hooks/useAiQuota'
import { FREE_TIER_MONTHLY_QUOTA } from '@/lib/supabase/ai-usage'

interface AiQuotaSectionProps {
  /** Whether the user has a BYO OpenAI token configured. When true, the
   * free-tier quota is irrelevant — they bypass it. */
  hasOwnToken: boolean
}

/**
 * Surfaces the user's free-tier monthly AI quota (shared between Aitor and
 * season narration) when the server-side Gemini fallback is in play. Stays
 * silent when the user has their own OpenAI token (no quota applies) or when
 * Supabase isn't configured.
 */
export default function AiQuotaSection({ hasOwnToken }: AiQuotaSectionProps) {
  const { isSignedIn } = useOptionalAuth()
  const { usage, error, isLoading } = useAiQuota(!hasOwnToken)

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
      aria-label="Free AI quota"
    >
      <Sparkles
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
          exhausted ? 'text-zen-kitsune-600' : 'text-zen-moss-600'
        }`}
        aria-hidden="true"
      />
      <div className="text-sm text-zen-ink-700">
        <p className="font-medium">
          {used} / {FREE_TIER_MONTHLY_QUOTA} free AI requests used this month
        </p>
        <p className="text-xs text-zen-stone-600 mt-1">
          {exhausted
            ? 'Free quota exhausted — it is shared between Aitor and season narration. Add your own OpenAI key below for unlimited Aitor use, or check back next month.'
            : 'This quota is shared between Aitor and season narration. Add your own OpenAI key below for unlimited Aitor use.'}
        </p>
      </div>
    </div>
  )
}
