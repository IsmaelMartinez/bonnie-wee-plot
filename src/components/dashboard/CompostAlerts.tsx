'use client'

import Link from 'next/link'
import { Recycle, RotateCw, Sparkles } from 'lucide-react'
import { useCompost } from '@/hooks/useCompost'

function getDaysSince(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function getLastTurnDate(pile: { events: Array<{ type: string; date: string }> }): string | null {
  const turnEvent = pile.events
    .filter(e => e.type === 'turn')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  return turnEvent?.date || null
}

export default function CompostAlerts() {
  const { data, isLoading } = useCompost()

  if (isLoading || !data || data.piles.length === 0) {
    return null
  }

  const activePiles = data.piles.filter(p => p.status === 'active' || p.status === 'maturing')

  // Find piles needing a turn (no turn in 7+ days)
  const needsTurn = activePiles.filter(pile => {
    const lastTurn = getLastTurnDate(pile)
    if (!lastTurn) {
      // If never turned, check if pile is old enough (7+ days)
      return getDaysSince(pile.startDate) >= 7
    }
    return getDaysSince(lastTurn) >= 7
  })

  // Find ready piles
  const readyPiles = data.piles.filter(p => p.status === 'ready')

  if (needsTurn.length === 0 && readyPiles.length === 0) {
    return null
  }

  return (
    <div className="zen-card p-4 border-zen-moss-200">
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
