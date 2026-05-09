'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Recycle, RotateCw, Sparkles } from 'lucide-react'
import { useCompost } from '@/hooks/useCompost'
import { getCompostPilesNeedingTurn } from '@/services/allotment-storage'

export default function CompostAlerts() {
  const { data, isLoading } = useCompost()

  // Re-derive on every render against the live `data` reference so the widget
  // updates whenever the underlying AllotmentData.compost array changes
  // (turn/harvest events, inputs added, pile status flipped to ready/applied).
  const { needsTurn, readyPiles } = useMemo(() => {
    if (!data) return { needsTurn: [], readyPiles: [] }
    return {
      needsTurn: getCompostPilesNeedingTurn(data),
      readyPiles: data.piles.filter(p => p.status === 'ready'),
    }
  }, [data])

  if (isLoading || !data || data.piles.length === 0) {
    return null
  }

  if (needsTurn.length === 0 && readyPiles.length === 0) {
    return null
  }

  return (
    <div className="zen-card p-4 border-zen-moss-200" data-tour="compost-alerts">
      <div className="flex items-center gap-2 mb-3">
        <Recycle className="w-5 h-5 text-zen-moss-600" />
        <h3 className="font-medium text-zen-ink-700">Compost</h3>
      </div>

      <div className="space-y-2">
        {needsTurn.length > 0 && (
          <Link
            href="/compost"
            className="flex items-center gap-3 p-2 rounded-zen bg-zen-kitsune-50 hover:bg-zen-kitsune-100 transition"
          >
            <RotateCw className="w-4 h-4 text-zen-kitsune-600" />
            <div>
              <span className="text-sm text-zen-kitsune-700">
                {needsTurn.length === 1
                  ? `${needsTurn[0].name} needs turning`
                  : `${needsTurn.length} piles need turning`}
              </span>
            </div>
          </Link>
        )}

        {readyPiles.length > 0 && (
          <Link
            href="/compost"
            className="flex items-center gap-3 p-2 rounded-zen bg-zen-water-50 hover:bg-zen-water-100 transition"
          >
            <Sparkles className="w-4 h-4 text-zen-water-600" />
            <div>
              <span className="text-sm text-zen-water-700">
                {readyPiles.length === 1
                  ? `${readyPiles[0].name} is ready to use!`
                  : `${readyPiles.length} piles ready to use!`}
              </span>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
