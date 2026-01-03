'use client'

import { SeasonalPhase } from '@/lib/seasons'
import { Season, SeasonalTheme } from '@/lib/seasonal-theme'

interface SeasonCardProps {
  seasonalPhase: SeasonalPhase
  currentMonth: number
  season: Season
  theme: SeasonalTheme
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function SeasonCard({ seasonalPhase, currentMonth, theme }: SeasonCardProps) {
  const monthName = MONTH_NAMES[currentMonth - 1] || 'Today'

  return (
    <div className={`zen-card overflow-hidden ${theme.bgAccent} ${theme.borderAccent} border`}>
      <div className="p-8 md:p-10">
        <div className="flex items-start gap-6">
          {/* Seasonal emoji - large, contemplative */}
          <div className="flex-shrink-0">
            <span
              className="text-5xl md:text-6xl block"
              role="img"
              aria-label={seasonalPhase.name}
            >
              {seasonalPhase.emoji}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium tracking-wide uppercase mb-2 ${theme.textMuted}`}>
              {monthName}
            </p>
            <h2 className={`text-2xl md:text-3xl mb-3 ${theme.textAccent}`}>
              {seasonalPhase.name}
            </h2>
            <p className="text-zen-ink-600 text-lg leading-relaxed">
              {seasonalPhase.action}
            </p>
          </div>
        </div>
      </div>

      {/* Subtle decorative element */}
      <div
        className="h-1 w-full opacity-30"
        style={{
          background: `linear-gradient(90deg, ${theme.decorPrimary} 0%, ${theme.decorSecondary} 50%, transparent 100%)`
        }}
      />
    </div>
  )
}
