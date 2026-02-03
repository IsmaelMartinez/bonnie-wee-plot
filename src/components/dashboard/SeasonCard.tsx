import Image from 'next/image'
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
    <div className="relative overflow-hidden rounded-zen-xl shadow-zen-md">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={theme.bgImage}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 896px"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-start gap-6">
          {/* Seasonal emoji - large, contemplative */}
          <div className="flex-shrink-0">
            <span
              className="text-5xl md:text-6xl block drop-shadow-lg"
              role="img"
              aria-label={seasonalPhase.name}
            >
              {seasonalPhase.emoji}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium tracking-wide uppercase mb-2 text-white/70">
              {monthName}
            </p>
            <h2 className="text-2xl md:text-3xl mb-3 text-white font-display">
              {seasonalPhase.name}
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              {seasonalPhase.action}
            </p>
          </div>
        </div>
      </div>

      {/* Photo credit */}
      <div className="absolute bottom-2 right-3 z-10">
        <a
          href={theme.bgImageCredit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
        >
          Photo by {theme.bgImageCredit.name}
        </a>
      </div>

      {/* Subtle decorative element */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
        style={{
          background: `linear-gradient(90deg, ${theme.decorPrimary} 0%, ${theme.decorSecondary} 50%, transparent 100%)`
        }}
      />
    </div>
  )
}
